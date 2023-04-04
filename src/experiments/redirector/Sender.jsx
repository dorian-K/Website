import React, { useEffect } from "react";
import "./Sender.css";
import useWebSocket from "react-use-websocket";

function Sender() {

	useEffect(() => {
		document.title = "Dorian Koch - Send links"
	  }, [])

	const queryParams = new URLSearchParams(window.location.search);
	const uid = queryParams.get("uid");

	const [inputState, setInputState] = React.useState({
		id: uid ?? "",
		url: "",
	});

	const { sendMessage } = useWebSocket(
		window.location.href.replace(/https?/, "wss"),
		{
			onMessage: (msgEvenet) => {
				console.log(msgEvenet.data);
			},
		}
	);

	let handleSubmit = (e) => {
		e.preventDefault();
		let msg = JSON.stringify({
			id: inputState.id,
			type: "url",
			url: inputState.url,
		});
		sendMessage(msg);
	};

	let handleValueChange = (e) => {
		const target = e.target;
		let value = target.value;
		switch (target.name) {
			case "id":
				if (value.length > 6) value = value.substring(0, 6);
				break;
			default:
				break;
		}

		let stet = inputState;
		stet[target.name] = value;

		setInputState({
			id: stet.id,
			url: stet.url,
		});
	};

	return (
		<div className="sendercontainer">
			<div className="formInput">
				<form onSubmit={handleSubmit}>
					<div class="mb-3">
						<label for="inputId" class="form-label">
							ID
						</label>
						<input
							name="id"
							type="number"
							class="form-control"
							id="inputId"
							aria-describedby="emailHelp"
							value={inputState.id}
							onChange={handleValueChange}
						/>
					</div>
					<div class="mb-3">
						<label for="inputUrl" class="form-label">
							URL
						</label>
						<input
							name="url"
							type="text"
							class="form-control"
							id="inputUrl"
							value={inputState.url}
							onChange={handleValueChange}
						/>
					</div>
					<button type="submit" class="btn btn-primary">
						Submit
					</button>
				</form>
			</div>
		</div>
	);
}

export default Sender;
