import React, { useEffect } from "react";
import QRCode from "qrcode.react";
import Measure from "react-measure";
import useWebSocket, { ReadyState } from "react-use-websocket";

import "./Acceptor.css";

function randDigit() {
	return Math.floor(Math.random() * 9 + 1);
}
function randNum(numDigis) {
	let str = "";
	for (let i = 0; i < numDigis; i++) str += randDigit();
	return str;
}

function QRGen() {
	const [state, setState] = React.useState({
		dimensions: {
			width: 1,
			height: 1,
		},
	});

	const { sendMessage, readyState } = useWebSocket(
		window.location.href.replace(/https?/, "wss"),
		{
			onMessage: (msgEvenet) => {
				let data = JSON.parse(msgEvenet.data);
				console.log(data);
				switch (data.type) {
					case "url":
						window.location.href = data.url;
						break;
					default:
						break;
				}
			},
		}
	);
	
	const [myId, setMyId] = React.useState("");
	React.useMemo(() => {
		switch (readyState) {
			case ReadyState.OPEN:
				let newId = randNum(6);
				setMyId(newId);
				sendMessage(JSON.stringify({ id: newId }));
				break;
			default:
				break;
		}
	}, [readyState, sendMessage]);

	let hasNumber = myId !== "";
	const { width, height } = state.dimensions;

	console.log("Ive been called with ", height, width);

	return (
		<div className="stuffholder">
			<Measure
				client
				onResize={(contentRect) => {
					setState({ dimensions: contentRect.client });
				}}
			>
				{({ measureRef }) => (
					<div ref={measureRef} className="qrgen">
						<QRCode
							value={
								hasNumber
									? "https://dorianko.ch/b?uid=" + myId
									: " "
							}
							renderAs="svg"
							size={Math.min(height, width)}
							style={{ display: hasNumber ? "inherit" : "none" }}
						/>
					</div>
				)}
			</Measure>
			<h1>
				{hasNumber
					? myId.substring(0, 3) + " " + myId.substring(3)
					: "connecting..."}
			</h1>
		</div>
	);
}

function Acceptor() {

	useEffect(() => {
		document.title = "Dorian Koch - Accept links"
	  }, [])

	return (
		<div className="reccontainer">
			<QRGen />
		</div>
	);
}

export default Acceptor;
