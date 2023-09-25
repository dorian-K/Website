import { create, all } from "mathjs";
import { P5CanvasInstance, SketchProps } from "@p5-wrapper/react";

const config = {};
const math = create(all, config);

export type PropsType = SketchProps & {
	expression: string
}

export type PropsType2 = SketchProps & {
	showVelocity: boolean,
	numBodies: number,
	showCenter: boolean
}

class ThreeDeeObject {
	x: number;
	y: number;
	z: number;
	velx: number;
	vely: number;
	velz: number;
	prevVel: Array<number>;
	mass: number;
	radius: number;
	index: number;

	constructor(ind: number) {
		this.index = ind;
		this.x = this.y = this.z = 0;
		this.velx = this.vely = this.velz = 0;
		this.radius = this.mass = 0;
		this.prevVel = [0, 0, 0];
	}

	init() {
		this.x = Math.random() * 500 - 250;
		this.y = Math.random() * 500 - 250;
		this.z = Math.random() * 500 - 250;
		this.setRadius(Math.random() * 15 + 10);
		this.velx = (Math.random() * 2 - 1) * this.mass;
		this.vely = (Math.random() * 2 - 1) * this.mass;
		this.velz = (Math.random() * 2 - 1) * this.mass;
	}

	setRadius(rad: number){
		this.radius = rad;
		this.mass = Math.pow(this.radius * 100, 3);
	}

	draw(p: P5CanvasInstance<PropsType2>, drawVel: boolean) {
		p.push();

		p.translate(this.x, this.y, this.z);
		//p.noFill();
		p.fill(255);
		p.sphere(this.radius);
		if(drawVel === true){
			p.stroke(255);
			p.strokeWeight(3);
			p.line(0, 0, 0, this.velx / this.mass * 50, this.vely / this.mass * 50, this.vely / this.mass * 50);
			
		}
		
		p.pop();
	}
}

export function sketch2(p: P5CanvasInstance<PropsType2>) {
	let showVelocity = false;
	let objects: Array<ThreeDeeObject> = [];
	let showCenter = false;

	let centerObj = new ThreeDeeObject(0);
	centerObj.setRadius(40);
	objects.push(centerObj); // static
	for(let i = 1; i < 5; i++){
		let newObj = new ThreeDeeObject(i);
		newObj.init();
		objects.push(newObj);
	}
		

	p.setup = () => {
		p.createCanvas(window.innerWidth, window.innerHeight, p.WEBGL);
		window.onresize = function () {
			p.resizeCanvas(window.innerWidth, window.innerHeight);
		};
	};

	p.updateWithProps = (props: PropsType2) => {
		try {
			
			showVelocity = props.showVelocity;
			showCenter = props.showCenter;
			let newNumBodies = Math.max(2, props.numBodies);
			while(objects.length > newNumBodies)
				objects.pop();
			while(objects.length < newNumBodies){
				let newObj = new ThreeDeeObject(objects.length);
				newObj.init();
				objects.push(newObj);
			}
		} catch (e) {
			console.error(e);	
		}
	};

	p.draw = () => {
		
		//p.background(Math.min(10, fCount * 0.5));
		p.background(0);

		p.noStroke();

		p.fill(255);
		
		//p.orbitControl(3, 3, 0);
		p.translate(0, 0, 0);
		//p.rotateX(p.mouseY / (p.height / 2) * Math.PI * -0.5);
		p.rotateX(-p.mouseY / (p.height / 2) * Math.PI * 0.35 + 0.35 * Math.PI);
		//p.rotateY(Math.PI * 0.25);
		p.rotateY(p.mouseX / (p.width / 2) * Math.PI); 

		//let fCount = Math.max(1, p.frameCount - firstFrame - 5);
		//p.rotateY(fCount * 0.001);
		//p.rotateX(0.2);
		
		if(true)
		{
			let fac = 20;
			let ext = 12;
			p.push();

			p.strokeWeight(1);
			p.stroke(200, 100);
			p.line(-fac * ext, 0, 0, fac * ext, 0, 0);
			p.line(0, 0, -fac * ext, 0, 0, fac * ext);
			p.line(0, -fac * ext, 0, 0, fac * ext, 0);

			p.pop();
		}
		
		let G = 6.674E-11;
		let NUM_ITERATIONS = 2;
		let dt = 1 / NUM_ITERATIONS;
		for(let iter = 0; iter < NUM_ITERATIONS; iter++){
			for (let i = 0; i < objects.length; i++) {
				let obj = objects[i];
				if (i === 0) {
					obj.velx = obj.vely = obj.velz = 0;
					continue;
				}

				for (let o = 0; o < objects.length; o++) {
					if (i === o)
						continue;
					let oo = objects[o];
					let r = Math.sqrt(Math.pow(obj.x - oo.x, 2) + Math.pow(obj.y - oo.y, 2) + Math.pow(obj.z - oo.z, 2));

					if (r >= 0.1 * (obj.radius + oo.radius)) {
						obj.velx += dt * G * obj.mass * oo.mass * (oo.x - obj.x) / Math.pow(r, 2);
						obj.vely += dt * G * obj.mass * oo.mass * (oo.y - obj.y) / Math.pow(r, 2);
						obj.velz += dt * G * obj.mass * oo.mass * (oo.z - obj.z) / Math.pow(r, 2);
					}

					if (r < obj.radius + oo.radius && false) {
						// collision

						// push them apart
						let contactNormal = [oo.x - obj.x, oo.y - obj.y];
						while (Math.sqrt(contactNormal[0] * contactNormal[0] + contactNormal[1] * contactNormal[1]) < 0.001) {
							contactNormal = [Math.random() - 0.5, Math.random() - 0.5];
						}
						let weglen = Math.sqrt(contactNormal[0] * contactNormal[0] + contactNormal[1] * contactNormal[1]);
						contactNormal = [contactNormal[0] / weglen, contactNormal[1] / weglen];

						//obj.x -= contactNormal[0] * 1.05 * (obj.radius + oo.radius - r);
						//obj.y -= contactNormal[1] * 1.05 * (obj.radius + oo.radius - r);


						let restitution = 0.2;

						// let velx = (restitution * oo.mass * (oo.velx - obj.velx) + obj.mass * obj.velx + oo.mass * oo.velx) / (obj.mass + oo.mass);
						// let vely = (restitution * oo.mass * (oo.vely - obj.vely) + obj.mass * obj.vely + oo.mass * oo.vely) / (obj.mass + oo.mass);
						let impulsex = obj.mass * oo.mass / (obj.mass + oo.mass) * (1 + restitution) * (oo.velx - obj.velx) * contactNormal[0];
						let impulsey = obj.mass * oo.mass / (obj.mass + oo.mass) * (1 + restitution) * (oo.vely - obj.vely) * contactNormal[1];
						obj.velx += impulsex / obj.mass * contactNormal[0];
						obj.vely += impulsey / obj.mass * contactNormal[1];

						oo.velx -= impulsex / oo.mass * contactNormal[0];
						oo.vely -= impulsey / oo.mass * contactNormal[1];

						//oo.velx = (restitution * obj.mass * (obj.velx - oo.velx) + obj.mass * obj.velx + oo.mass * oo.velx) / (obj.mass + oo.mass);
						//oo.vely = (restitution * obj.mass * (obj.vely - oo.vely) + obj.mass * obj.vely + oo.mass * oo.vely) / (obj.mass + oo.mass);

					}
				}
			}
			for(let i = 1; i < objects.length; i++){
				let obj = objects[i];
				obj.x += dt * 0.5 * (obj.velx + obj.prevVel[0]) / obj.mass;
				obj.y += dt * 0.5 * (obj.vely + obj.prevVel[1]) / obj.mass;
				obj.z += dt * 0.5 * (obj.velz + obj.prevVel[2]) / obj.mass;
				obj.prevVel = [obj.velx, obj.vely, obj.velz];
			}
		}

		if(showCenter){
			p.ambientLight(170, 170, 150);
			objects[0].draw(p, showVelocity);
		}
		
		p.noLights();
		p.ambientLight(50, 50, 50);
		p.pointLight(255, 240, 200, 0, 0, 0);
		for(let i = 1; i < objects.length; i++){
			objects[i].draw(p, showVelocity);
		}
	};
}

export function sketch(p: P5CanvasInstance<PropsType>) {
	let firstFrame = 0;
	let curDisplay = 1;
	let compiledExpr = math.compile("sin(t + x * y * 0.2)");

	p.setup = () => {
		p.createCanvas(window.innerWidth, window.innerHeight, p.WEBGL);
		window.onresize = function () {
			p.resizeCanvas(window.innerWidth, window.innerHeight);
		};
		firstFrame = p.frameCount;
	};

	p.updateWithProps = (props: PropsType) => {
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
		let pulse = -p.cos((value / 128) * Math.PI) / 2 + 0.5;
		if (fCount > 128) pulse = 1;
		//if (value === 511) {
		//	curDisplay++;
		//	if (curDisplay > 1) curDisplay = 0;
		//}

		//p.background(Math.min(10, fCount * 0.5));
		p.background(0);

		p.noStroke();

		p.ambientLight(pulse * 100, pulse * 100, pulse * 100);

		p.fill(255);

		/*if (fCount < 100)
			p.translate(
				0,
				0,
				-3000 * (1 - p.sin((fCount * 0.01 * 3.14159) / 2))
			);*/

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
						} catch (e) { }
						value = Math.max(Math.min(value, 500), -500);
						p.ambientMaterial((value < 0 ? value * -200 : 0) + 30,
							(value > 0 ? value * 200 : 0) + 30,
							30)
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
