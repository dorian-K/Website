import { create, all } from "mathjs";

const config = {};
const math = create(all, config);

export default function sketch(p) {
	let firstFrame = 0;
	let curDisplay = 1;
	let compiledExpr = math.compile("sin(t + x * y * 0.2)");

	p.setup = () => {
		p.createCanvas(window.innerWidth, window.innerHeight, p.WEBGL);
		window.onresize = function () {
			p.createCanvas(window.innerWidth, window.innerHeight, p.WEBGL);
		};
		firstFrame = p.frameCount;
	};

	p.updateWithProps = (props) => {
		try {
			if (props.expression) {
				compiledExpr = math.compile(props.expression);
			}
		} catch (e) {
			compiledExpr = math.compile("0");
		}
	};

	p.myCustomRedrawAccordingToNewPropsHandler = (props) => {
		try {
			if (props.expression) {
				compiledExpr = math.compile(props.expression);
			}
		} catch (e) {
			compiledExpr = math.compile("0");
		}
	};

	p.draw = () => {
		let fCount = Math.max(1, p.frameCount - firstFrame - 5);

		let fac = 1;
		let value = (fCount * fac) % 512;
		let pulse = -p.cos((value / 256) * Math.PI) / 2 + 0.5;
		if (fCount > 256) pulse = 1;
		//if (value === 511) {
		//	curDisplay++;
		//	if (curDisplay > 1) curDisplay = 0;
		//}

		//p.background(Math.min(10, fCount * 0.5));
		p.background(0);

		p.noStroke();

		let locX = (p.mouseX / p.width - 0.5) * -5;
		let locY = (p.mouseY / p.height - 0.5) * -5;

		//let mX = p.mouseX - p.width * 0.5;
		//let mY = p.mouseY - p.height * 0.5;

		p.ambientLight(pulse * 100, pulse * 100, pulse * 100);
		p.directionalLight(
			255 * pulse,
			255 * pulse,
			255 * pulse,
			locX,
			locY,
			1
		);
		//p.lightFalloff(0.9, 0.001, 0);

		p.fill(255);

		if (fCount < 200)
			p.translate(
				0,
				0,
				-3000 * (1 - p.sin((fCount * 0.005 * 3.14159) / 2))
			);

		switch (curDisplay) {
			case 0:
				p.translate(0, 0, -500);
				p.rotateY(fCount * 0.01);
				for (let j = -2; j < 2; j++) {
					p.push();

					for (let i = 0; i < 100; i++) {
						p.translate(
							p.sin(p.frameCount * 0.001 + j) * 100,
							p.sin(p.frameCount * 0.001 - j) * 100,
							i * 0.08
						);
						p.rotateZ(p.frameCount * 0.002 + 0.1);
						p.push();
						p.sphere(4);
						p.pop();
					}
					p.pop();
				}
				break;
			case 1:
				p.translate(0, 50, 0);
				p.rotateY(fCount * 0.01);

				p.rotateX(0.5);

				// draw grid
				// eslint-disable-next-line no-lone-blocks
				{
					let fac = 20;
					let ext = 12;
					p.push();

					p.stroke(200, 150);
					p.line(-fac * ext, -20, 0, fac * ext, -20, 0);
					p.line(0, -20, -fac * ext, 0, -20, fac * ext);
					p.line(0, -20 + -fac * ext, 0, 0, -20 + fac * ext, 0);

					p.pop();
				}

				p.noStroke();

				let prec = 1;
				for (let x = -10; x <= 10; x += prec) {
					for (let y = -10; y <= 10; y += prec) {
						p.push();

						//let value = p.sin(fCount * 0.02 + x * 0.1 * z * 0.13);
						let value = 0;
						try {
							let scope = {
								x: x / 2,
								y: y / 2,
								t: fCount * 0.02,
							};

							value = compiledExpr.evaluate(scope);
						} catch (e) {}
						value = Math.max(Math.min(value, 500), -500);
						p.fill(
							(value < 0 ? value * -200 : 0) + 30,
							(value > 0 ? value * 200 : 0) + 30,
							30
						);

						//let value = x;
						value *= -50;
						p.translate(x * 20, -20 + value * 0.5, y * 20);
						p.box(15 * prec, value, 15 * prec);
						p.pop();
					}
				}

				break;
			default:
				break;
		}
	};
}
