import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [isLatest, setIsLatest] = useState(true);
  const [updateMessage, setUpdateMessage] = useState("");

  async function checkAndUpdateRepo() {
    try {
      const isUpToDate = await invoke("check_repo_status", { path: "/Users/lucasay/Projects/project-aigc/ComfyUI" });
      setIsLatest(isUpToDate as boolean);
      
      // if (!isUpToDate) {
      //   const pullResult = await invoke("pull_repo", { path: "/Users/lucasay/Projects/project-aigc/ComfyUI" });
      //   setUpdateMessage(pullResult ? "Repository updated successfully" : "Failed to update repository");
      // }
    } catch (error) {
      console.error("Error checking/updating repository:", error);
      setUpdateMessage("Error checking/updating repository");
    }
  }

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name }));
  }

  useEffect(() => {
    checkAndUpdateRepo();
  }, []);

  return (
    <div className="container">
      <h1>Welcome to Tauri!</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <p>{isLatest ? "ComfyUI is up to date" : "ComfyUI needs updating"}</p>
      <p>{updateMessage}</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>

      <p>{greetMsg}</p>
    </div>
  );
}

export default App;
