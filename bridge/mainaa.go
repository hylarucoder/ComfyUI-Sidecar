package bridge

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"

	"github.com/gin-gonic/gin"
	"github.com/go-cmd/cmd"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/go-git/go-git/v5/plumbing/storer"
)

func tryStaticResourceFirst(path string) (string, bool) {
	staticResourcePath := "/Users/lucasay/Projects/project-aigc/ComfyUI/web"
	staticExtensions := []string{".js", ".css", ".jpg", ".png", ".gif", ".svg", ".map", ".json"}

	if strings.HasPrefix(path, "/api") {
		return "", false
	}

	for _, ext := range staticExtensions {
		if !strings.HasSuffix(path, ext) {
			continue
		}

		staticFilePath := staticResourcePath + path
		if _, err := os.Stat(staticFilePath); err == nil {
			return staticFilePath, true
		}
	}

	return "", false
}

func proxy(c *gin.Context) {
	remote, err := url.Parse("http://127.0.0.1:8188")
	if err != nil {
		panic(err)
	}

	path := c.Param("proxyPath")
	if strings.HasPrefix(path, "/api/view") {
		// Parse query parameters
		query := c.Request.URL.Query()
		filename := query.Get("filename")
		subfolder := query.Get("subfolder")
		fileType := query.Get("type")
		if fileType == "input" || fileType == "output" {
			// Ensure the subfolder doesn't contain any ".." to prevent directory traversal
			if strings.Contains(subfolder, "..") || strings.Contains(filename, "..") {
				c.String(http.StatusForbidden, "Invalid path")
				return
			}

			// Construct the file path, ensuring it's within the allowed directories
			basePath := "/Users/lucasay/Projects/project-aigc/ComfyUI"
			filePath := filepath.Join(basePath, fileType, subfolder, filename)

			// Verify that the constructed path is still within the allowed directory
			if !strings.HasPrefix(filePath, filepath.Join(basePath, fileType)) {
				c.String(http.StatusForbidden, "Access denied")
				return
			}

			// Check if the file exists
			if _, err := os.Stat(filePath); err == nil {
				// File exists, serve it
				c.File(filePath)
				return
			}
		}

		// Construct the file path
		// If file not found, continue with the proxy
	}
	staticFile, found := tryStaticResourceFirst(path)

	if found {
		c.File(staticFile)
		return
	}
	// Check if the path is empty
	fmt.Println("path", path)
	if path == "/" {
		// Modify the response to inject a script
		proxy := httputil.NewSingleHostReverseProxy(remote)
		proxy.ModifyResponse = func(r *http.Response) error {
			if r.Header.Get("Content-Type") == "text/html" {
				// Ensure we're not dealing with a 304 Not Modified response
				if r.StatusCode != http.StatusNotModified {
					oldBody, err := io.ReadAll(r.Body)
					if err != nil {
						return err
					}
					r.Body.Close()

					newBody := strings.Replace(string(oldBody), "</body>",
						`<script>console.log("hello from golang");</script></body>`, 1)

					r.Body = io.NopCloser(strings.NewReader(newBody))
					r.ContentLength = int64(len(newBody))
					r.Header.Set("Content-Length", strconv.Itoa(len(newBody)))
				}
			}
			return nil
		}
		proxy.ServeHTTP(c.Writer, c.Request)
		return
	}

	proxy := httputil.NewSingleHostReverseProxy(remote)
	proxy.Director = func(req *http.Request) {
		req.Header = c.Request.Header
		req.Host = remote.Host
		req.URL.Scheme = remote.Scheme
		req.URL.Host = remote.Host
		req.URL.Path = path
		req.Header.Set("Origin", "http://127.0.0.1:8188")
	}

	proxy.ServeHTTP(c.Writer, c.Request)
}

func CheckIfError(err error) {
	if err == nil {
		return
	}

	fmt.Printf("\x1b[31;1m%s\x1b[0m\n", fmt.Sprintf("error: %s", err))
	os.Exit(1)
}

func Info(format string, args ...interface{}) {
	fmt.Printf("\x1b[34;1m%s\x1b[0m\n", fmt.Sprintf(format, args...))
}

func downloadFile(url string, outputFile string) error {
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	out, err := os.Create(outputFile)
	if err != nil {
		return err
	}
	defer out.Close()

	// Get the total size of the file
	totalSize := resp.ContentLength

	// Create a progress reader
	reader := &ProgressReader{
		Reader: resp.Body,
		Total:  totalSize,
	}

	// Copy the body to the file with progress
	_, err = io.Copy(out, reader)
	fmt.Println() // Print a newline after progress
	return err
}

type ProgressReader struct {
	Reader     io.Reader
	Total      int64
	Downloaded int64
}

func (pr *ProgressReader) Read(p []byte) (int, error) {
	n, err := pr.Reader.Read(p)
	pr.Downloaded += int64(n)
	pr.showProgress()
	return n, err
}

func (pr *ProgressReader) showProgress() {
	if pr.Total <= 0 {
		return
	}
	percentage := float64(pr.Downloaded) / float64(pr.Total) * 100
	fmt.Printf("\rDownloading... %.2f%%", percentage)
}

func cloneIfNotExists(url string, path string) {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		Info("Path does not exist, cloning repository...")
		_, err := git.PlainClone(path, false, &git.CloneOptions{
			URL:      url,
			Progress: os.Stdout,
		})
		CheckIfError(err)
	}
}

func ReadLast10Commits(path string) []map[string]string {
	repo, err := git.PlainOpen(path)
	CheckIfError(err)

	ref, err := repo.Head()
	CheckIfError(err)

	commit, err := repo.CommitObject(ref.Hash())
	CheckIfError(err)

	logOptions := &git.LogOptions{
		From:  commit.Hash,
		Order: git.LogOrderCommitterTime,
	}

	cIter, err := repo.Log(logOptions)
	CheckIfError(err)

	commits := []map[string]string{}
	count := 0
	err = cIter.ForEach(func(c *object.Commit) error {
		if count >= 10 {
			return storer.ErrStop
		}
		message := strings.ReplaceAll(c.Message, "\n", "  ")
		if len(message) > 100 {
			message = message[:97] + "..."
		}
		commits = append(commits, map[string]string{
			"Commit":  c.Hash.String()[:7],
			"Author":  c.Author.Name,
			"Date":    c.Author.When.Format("2006-01-02 15:04:05"),
			"Message": message,
		})
		count++
		return nil
	})
	CheckIfError(err)

	return commits
}

func installMinicondaIfNotExists(comfyUIMinicondaPath string) {
	// 下载 miniconda
	url := "https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-arm64.sh"
	outputFile := "miniconda.sh"
	if _, err := os.Stat(outputFile); os.IsNotExist(err) {
		err := downloadFile(url, outputFile)
		if err != nil {
			fmt.Printf("Failed to download Miniconda installer: %v\n", err)
		}
	}
	if _, err := os.Stat(comfyUIMinicondaPath); os.IsNotExist(err) {
		Info("Miniconda does not exist, installing...")
		cmd := exec.Command("bash", "miniconda.sh", "-b", "-f", "-p", comfyUIMinicondaPath)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		err = cmd.Run()
		CheckIfError(err)
	}
}

func checkComfyUISidecarEnv(comfyUIMinicondaPath string) {
	// install python 3.11 conda env
	acmd := cmd.NewCmd(comfyUIMinicondaPath+"/bin/conda", "env", "list")
	result := <-acmd.Start()
	CheckIfError(result.Error)
	if !strings.Contains(strings.Join(result.Stdout, ""), "comfyui-sidecar") {
		Info("Creating comfyui-sidecar environment...")
		bcmd := cmd.NewCmd(comfyUIMinicondaPath+"/bin/conda", "create", "-n", "comfyui-sidecar", "python=3.11", "-y")
		bResult := <-bcmd.Start()
		CheckIfError(bResult.Error)
		Info("comfyui-sidecar environment created successfully")
	} else {
		Info("comfyui-sidecar environment already exists")
	}
	Info("comfyui-sidecar environment already exists")
	// install pytorch if not exist
	// requirements.txt
}

func main() {
	// 确保 ComfyUI 存在
	comfyUIPath := "/Users/lucasay/Projects/project-aigc/ComfyUI"
	comfyUIMinicondaPath := "/Users/lucasay/Projects/project-aigc/ComfyUI-Miniconda"
	condaBin := comfyUIMinicondaPath + "/bin/conda"
	Info("git clone https://github.com/comfyanonymous/ComfyUI")
	cloneIfNotExists("https://github.com/comfyanonymous/ComfyUI", comfyUIPath)
	Info("Path exists, skipping clone")
	ReadLast10Commits(comfyUIPath)
	installMinicondaIfNotExists(comfyUIMinicondaPath)
	checkComfyUISidecarEnv(comfyUIMinicondaPath)

	envCmd := cmd.NewCmd(condaBin, "run", "-n", "comfyui-sidecar", "pip", "install", "torch", "torchvision", "torchaudio", "--extra-index-url", "https://download.pytorch.org/whl/nightly/cpu")
	envCmd.Dir = comfyUIPath
	executeEnvCmd(envCmd)
	Info("pip install pytorch successfully")
	// install requirements.txt
	envCmd = cmd.NewCmd(condaBin, "run", "-n", "comfyui-sidecar", "pip", "install", "-r", "requirements.txt")
	envCmd.Dir = comfyUIPath
	executeEnvCmd(envCmd)
	Info("pip install requirements.txt successfully")
	checkPyTorchCmd := cmd.NewCmd(condaBin, "run", "-n", "comfyui-sidecar", "python", "-c", "import torch; print(f'PyTorch version: {torch.__version__}'); ")
	s := <-checkPyTorchCmd.Start()
	fmt.Println("py", s.Stdout)

	// 打印的时候
	cmdOptions := cmd.Options{
		Buffered:  false,
		Streaming: true,
	}

	envCmd = cmd.NewCmdOptions(cmdOptions, condaBin, "run", "-n", "comfyui-sidecar", "--no-capture-output", "python", "main.py")
	envCmd.Dir = comfyUIPath
	// Create a channel to signal when executeEnvCmd is done
	done := make(chan bool)

	// Run executeEnvCmd in a goroutine
	go func() {
		executeEnvCmd(envCmd)
		done <- true
	}()

	// Run forwardComfyUI in a goroutine
	go forwardComfyUI()

	// Wait for executeEnvCmd to finish
	<-done
}

func forwardComfyUI() {
	// 访问 http://localhost:1680/ 的
	r := gin.Default()

	r.Any("/*proxyPath", proxy)

	r.Run(":8080")

}

func executeEnvCmd(envCmd *cmd.Cmd) {
	// Print STDOUT and STDERR lines streaming from Cmd
	doneChan := make(chan struct{})
	go func() {
		defer close(doneChan)
		// Done when both channels have been closed
		// https://dave.cheney.net/2013/04/30/curious-channels
		for envCmd.Stdout != nil || envCmd.Stderr != nil {
			select {
			case line, open := <-envCmd.Stdout:
				if !open {
					envCmd.Stdout = nil
					continue
				}
				fmt.Println(line)
			case line, open := <-envCmd.Stderr:
				if !open {
					envCmd.Stderr = nil
					continue
				}
				fmt.Fprintln(os.Stderr, line)
			}
		}
	}()

	// Run and wait for Cmd to return, discard Status
	statusChan := envCmd.Start()

	// Setup a channel to handle program exit
	exitChan := make(chan os.Signal, 1)
	signal.Notify(exitChan, os.Interrupt, syscall.SIGTERM)

	// Wait for either the command to finish or the program to exit
	select {
	case <-statusChan:
		// Command finished normally
	case <-exitChan:
		// Program is exiting, stop the command
		if err := envCmd.Stop(); err != nil {
			fmt.Fprintf(os.Stderr, "Error stopping command: %v\n", err)
		}
	}

	// Wait for goroutine to print everything
	<-doneChan
}
