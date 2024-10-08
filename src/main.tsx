import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {createBrowserRouter, Link, Outlet, RouterProvider} from "react-router-dom";
import {Home} from "@/pages/home.tsx";
import {createStyles} from "antd-style";
import {Button, Space} from "antd";
import {HomeOutlined, SettingOutlined} from "@ant-design/icons";
import {Versions} from "@/pages/versions.tsx";

const useStyles = createStyles(({token, css}) => ({
    container: {
        backgroundColor: token.colorBgLayout,
        borderRadius: token.borderRadiusLG,
        width: '100%',
        height: '100vh',
        display: 'flex',
        margin: 0,
    },
    // Also supports obtaining the same writing experience as normal css through css string templates
    card: css`
        box-shadow: ${token.boxShadow};
        padding: ${token.padding}px;
        border-radius: ${token.borderRadius}px;
        color: ${token.colorTextTertiary};
        background: ${token.colorBgContainer};
        transition: all 100ms ${token.motionEaseInBack};

        margin-bottom: 8px;
        cursor: pointer;
    `,
    sidebar: css`
        width: 64px;
        height: 100%;
        overflow: hidden;
        text-wrap: nowrap;
        background: #FFFFFF;
    `,
    pageLayout: css`
        width: 100%;
        height: 100%;
        background: #0f0f0f33;
    `,
}));

function Sidebar() {
    const {styles, cx, theme} = useStyles();
    return (
        <div className={cx("sidebar", styles.sidebar)}>
            <Space direction="vertical" size="large" style={{
                display: 'flex',
            }}>
                <Link to={"/"}>
                    <HomeOutlined size={60}/>
                </Link>
                <br/>
                <Link to={"/initialization"}> 首次配置页</Link>
                <br/>
                <Link to={"/versions"}> 版本管理 </Link>
                <br/>
                <Link to={"/environment"}> 环境管理 </Link>
                <br/>
                <Link to={"/models"}> 模型管理 </Link>
                <br/>
                <Link to={"/config"}> 配置管理 </Link>
                <br/>
                <Link to={"/settings"}>
                    <SettingOutlined/>
                </Link>
                <br/>
                <Link to={"/environmeat"}> 测试 404</Link>
            </Space>
        </div>
    )
}


const BasicLayout = () => {
    const {styles, cx, theme} = useStyles();
    return (
        <div className={cx('container', styles.container)}>
            <Sidebar/>
            <Outlet/>
        </div>
    )
}

const router = createBrowserRouter([
    {
        path: "/",
        element: <BasicLayout/>,
        children: [
            {
                path: "",
                element: <App/>,
            },
            {
                path: "/initialization",
                element: <div> initialization </div>,
            },
            {
                path: "/versions",
                element: <Versions/>,
            },
            {
                path: "/environment",
                element: <div> environment </div>,
            },
            {
                path: "/models",
                element: <div> models </div>,
            },
            {
                path: "/config",
                element: <div> config </div>,
            },
            {
                path: "/settings",
                element: <div> settings </div>,
            },
            {
                path: "*",
                element: <div>
                    <Link to={"/"}> 404 click to back</Link>
                </div>,
            },
        ],
    },
    {
        path: "/app",
        element: <App/>,
    },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <RouterProvider router={router}/>
    </React.StrictMode>,
);
