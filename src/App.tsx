import {useState, useEffect} from "react";
import {invoke} from "@tauri-apps/api/core";
import "./App.css";

import {createStyles} from 'antd-style';
import {Breadcrumb, Button, Form, Input} from "antd";
import {Home} from "@/pages/home.tsx";
import {createBrowserRouter, Outlet} from "react-router-dom";

const useStyles = createStyles(({token, css}) => ({
    container: {
        backgroundColor: token.colorBgLayout,
        borderRadius: token.borderRadiusLG,
        width: '100%',
        height: '100vh',
        display: 'flex',
        margin: 0,
    },
    sidebar: css`
        width: 100px;
        height: 100%;
        background: #0f0f0f33;

        &:hover {
            color: ${token.colorTextSecondary};
            box-shadow: ${token.boxShadowSecondary};
        }
    `,
    pageLayout: css`
        width: 100%;
        height: 100%;
        background: #0f0f0f33;

        &:hover {
            color: ${token.colorTextSecondary};
            box-shadow: ${token.boxShadowSecondary};
        }
    `,
}));


type FieldType = {
    path?: string;
};

function App() {
    const {styles, cx, theme} = useStyles();
    const [greetMsg, setGreetMsg] = useState("");
    const [name, setName] = useState("");
    const [isLatest, setIsLatest] = useState(true);
    const [updateMessage, setUpdateMessage] = useState("");
    const [gitLog, setGitLog] = useState([]);


    async function greet() {
        // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
        setGreetMsg(await invoke("greet", {name}));
    }


    return (
        <div className={cx("page-layout", styles.pageLayout)}>
            <Breadcrumb
                items={[
                    {
                        title: 'Home',
                    },
                    {
                        title: <a href="">Application Center</a>,
                    },
                    {
                        title: <a href="">Application List</a>,
                    },
                    {
                        title: 'An Application',
                    },
                ]}
            />

            <p>Click on the Tauri, Vite, and React logos to learn more.</p>

            <p>{isLatest ? "ComfyUI is up to date" : "ComfyUI needs updating"}</p>
            <p>{updateMessage}</p>


            <Form
                name="basic"
                labelCol={{span: 8}}
                wrapperCol={{span: 16}}
                style={{maxWidth: 600}}
                initialValues={{path: "/Users/lucasay/Projects/project-aigc/ComfyUI"}}
                onFinish={(v) => {
                    console.log("onFinish", v)
                }}
                onFinishFailed={(v) => {
                    console.log("onFinishFailed", v)
                }}
                autoComplete="off"
            >
                <Form.Item<FieldType>
                    label="path"
                    name="path"
                    rules={[{required: true, message: 'Please input your username!'}]}
                >
                    <Input/>
                </Form.Item>
                <Button type={"primary"}>Start ComfyUI</Button>
            </Form>
        </div>
    );
}


export default App;
