import { Component, StrictMode } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App";

class QraftErrorBoundary extends Component<{children:ReactNode},{hasError:boolean}> {
  state={hasError:false};
  static getDerivedStateFromError(){return {hasError:true};}
  componentDidCatch(error:unknown,info:ErrorInfo){console.error("Qraft render error",error,info);}
  render(){
    if(!this.state.hasError)return this.props.children;
    return <div className="qraft-crash-screen"><div className="qraft-crash-card"><div className="qraft-crash-mark">Q</div><span className="page-eyebrow">QRAFT RECOVERY</span><h1>Something needs a quick reset.</h1><p>The workspace hit an unexpected render error. Your browser-stored projects are kept locally.</p><button className="primary" type="button" onClick={()=>window.location.reload()}>Reload Qraft</button></div></div>;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode><QraftErrorBoundary><App /></QraftErrorBoundary></StrictMode>
);

if("serviceWorker" in navigator&&import.meta.env.PROD)window.addEventListener("load",()=>{navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`,{scope:import.meta.env.BASE_URL}).catch(()=>{})});
