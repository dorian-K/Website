import * as Comlink from 'comlink';
import init, * as wasm from "../wasm/pkg/wasm"

let nodeMgr: null | wasm.NodeManager = null;

function newNodeManager(x: number, y: number) {
    nodeMgr = new wasm.NodeManager(new wasm.Vec2(x, y));
}

function tickGetNodes(){
    if (nodeMgr === null)
        throw new Error("Node manager null");

    let start = performance.now();
    for (let i = 0; i < 4; i++) nodeMgr.tick();
    let end = performance.now();
   
    let lastNodeList = nodeMgr.get_nodes() as Array<{ x: number, y: number, last_operation: number }>;
    return {
        time: end - start,
        lastNodeList: lastNodeList,
        epoch: nodeMgr.epoch,
        targetPos: { x: nodeMgr.target_pos.x, y: nodeMgr.target_pos.y }
    }
}

type HandlerRet = {
    newNodeManager: typeof newNodeManager,
    tickGetNodes: typeof tickGetNodes
} & Comlink.ProxyMarked;

async function initHandlers(): Promise<HandlerRet> {
   
    await init();
    await wasm.initThreadPool(1);

    return Comlink.proxy({
        newNodeManager,
        tickGetNodes
    });
}

Comlink.expose({
    handlers: initHandlers()
});

export type { HandlerRet };