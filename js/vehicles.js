class vehicle{
	constructor(speed = 10){
		this.pos = new vec2(
			rand() < 0 ? 
				-this.graphic.width : 
				canvas.width + this.graphic.width,
			lanes[Math.floor(rand(0, lanes.length))] );
		this.vel = new vec2(
			this.pos.x > 0 ? 
				-speed :
				speed, 
			0 );
		this.moveDir = dir.left;
		this.deathRotVel = 0;
		this.steer = 0;
		this.swerving = false;
		this.speed = speed;
		this.braking = false;
		this.alive = true;
		this.id = vehicle.getNextUID();
		this.setCollision();
		this.skidL = null;
		this.skidR = null;
		this.skidding = false;
	}
	get graphic(){
		return null; // meant for override
	}
	static getNextUID(){
		if(!vehicle.nextUID)
			vehicle.nextUID = 0;
		
		vehicle.nextUID += 1;
		return vehicle.nextUID;
	}
	
	setCollision(){
		this.col = polygon.Rectangle(this.graphic.width, this.graphic.height);
		this.alignCollision;
	}
	alignCollision(){
		this.col.setPosition(this.pos.clone());
		this.col.setRotation(this.moveDir);
	}
	
	drive(){
		// main entry point for the AI logic step
		this.doCollisionPrevention();
		if(this.braking) this.brake();
		else this.accelerate();
	}
	doCollisionPrevention(){
		if(this.steer <= 0.2)
			this.swerving = false;
		this.steer *= 0.95;
		
		//if(rand() > 0.9)
		//	this.steer += rand(-1, 1) / 5;
		
		var pcols = this.getPotentialCollisions();
		var brakeAhead = false;
		for(var i = pcols.length - 1; i >= 0; i --){
			var dist = this.pos.distance(pcols[i].pos);
			if(dist <= 70)
				brakeAhead = true;
			
			if(pcols[i] instanceof player){
				var testlength = 30 * this.vel.distance();
				var maxswerve = 1;
				var centr = (lanes[2] + lanes[3]) / 2;
				var sdir = Math.sign(this.pos.y - centr);
				
				var swerv = (
					Math.max(
					(testlength - dist) / testlength, 
					0) * maxswerve * sdir);
				this.swerve(swerv)
				this.swerving = true;
				continue;
			}
			if(this.swerving) continue;
			
			var testlength = 30 * this.vel.distance();
			var maxswerve = 2;
			var centr = pcols[i].pos.y;
			var sdir = Math.sign(centr - this.pos.y);
			
			var swerv = (
				Math.max(
				(testlength - dist) / testlength, 
				0) * sdir);
			
			if(pcols[i].speed < this.speed)
				this.speed = pcols[i].speed;
			if(Math.abs(swerv) >= 0.2){
				this.swerve(swerv * maxswerve);
				this.swerving = true;
			}
		}
		
		if(brakeAhead){
			this.braking = true;
		}
		else this.braking = false;
		
		if(rand() > 0.95){
			if(this.speed <= 1){
				if(pcols <= 0){
					this.swerve();
					this.speed = rand(5, 10);
				}
			}
		}
	}
	getPotentialCollisions(){
		var m = [];
		
		var testLength = this.vel.distance() * 30;
		var testPoly = new polygon();
		var verts = [
			new vec2(0, -13),
			new vec2(0, 13),
			new vec2(testLength, 14),
			new vec2(testLength, -14)
		];
		testPoly.setVerts(verts);
		testPoly.setPosition(this.pos.clone());
		testPoly.setRotation(this.moveDir);
		if(debugDraw)
			testPoly.drawOutline(context, "#FF0", 2);
		
		for(var i = vehicles.length - 1; i >= 0; i--){
			if(this.id == vehicles[i].id) continue;
			if(testPoly.polygonIntersections(vehicles[i].col).length > 0)
				m.push(vehicles[i]);
		}
		
		if(testPoly.polygonIntersections(player1.col).length > 0)
			m.push(player1);
		
		return m;
	}
	accelerate(){
		var acc = 0.35;
		var dVel = vec2.fromAng(this.moveDir, acc);
		
		//ensure the vehicle doesn't pass its predetermined speed
		var fSpd = this.vel.plus(dVel).distance();
		if(fSpd > this.speed)
			dVel = vec2.fromAng(this.moveDir, Math.max(this.speed - fSpd, -0.1));
		
		this.vel = this.vel.plus(dVel);
	}
	brake(){
		this.vel = this.vel.multiply(0.9);
		this.doSkidEffect(0.5);
	}
	swerve(direction = rand(-1, 1)){
		this.steer += direction;
	}
	handleSteeringPhysics(){
		var spd = this.vel.distance();
		
		if(this.steer != 0){
			this.moveDir += (this.steer * spd) / 100;
		}
		
		// the difference between the direction the vehicle is facing and the direction it's moving in
		var sdif = angDist(this.moveDir, this.vel.direction());
		
		// maximum working friction applied
		var fric = 0.8;
		
		//working friction is determined by finding the difference between the direction the vehicle is
		//moving in and direction that it's pointed in, and then based on that value, applying a friction
		//coefficient between between the determined maximum friction and 1
		var workingFric = 
			((1 - Math.min(Math.abs(sdif) / (Math.PI / 2), 1) - 1) * 
			(1 - fric)) + 1;
		
		//apply the working friction
		var oVel = this.vel.clone();
		this.vel = this.vel.multiply(workingFric);
		
		//calculate deacceleration
		var dAcc = oVel.minus(this.vel).distance();
		
		//add the deacceleration back to the velocity in the direction that the vehicle is now moving
		this.vel = this.vel.plus(vec2.fromAng(this.moveDir, dAcc));
		
		var sFact = Math.abs(sdif) * spd;
		if(sFact > 1)
			this.doSkidEffect(Math.min((sFact - 1) / 4, 1));// make skid marks
	}
	
	doSkidEffect(lAlpha = 1, rAlpha = lAlpha){
		if(!this.skidL || !this.skidR)
			this.openSkidMarks();
		this.skidL.addPoint(this.getSkidLPos(), lAlpha);
		this.skidR.addPoint(this.getSkidRPos(), rAlpha);
		this.skidding = true;
	}
	getSkidLPos(){
		return this.pos;
	}
	getSkidRPos(){
		return this.pos;
	}
	openSkidMarks(){
		this.skidL = new skidMark();
		this.skidR = new skidMark();
		this.skidL.add();
		this.skidR.add();
	}
	closeSkidMarks(){
		if(this.skidL){
			this.skidL.draw(effectContext);
			this.skidL.remove();
			this.skidL = null;
		}
		if(this.skidR){
			this.skidR.draw(effectContext);
			this.skidR.remove();
			this.skidR = null;
		}
	}
	
	handleCollisions(){
		this.checkVehicleCollisions();
		this.checkPlayerCollision();
	}
	isOverlappingVehicle(){
		for(var i = vehicles.length - 1; i >= 0; i--){
			if(this.id === vehicles[i].id)
				continue;
			if(this.col.polygonIntersections(vehicles[i].col).length > 0){
				return true;
			}
		}
		return false;
	}
	checkVehicleCollisions(){
		for(var i = vehicles.length - 1; i >= 0; i--){
			if(this.id === vehicles[i].id)
				continue;
			if(this.col.polygonIntersections(vehicles[i].col).length > 0){
				this.vehicleCollide(vehicles[i]);
			}
		}
	}
	checkPlayerCollision(){
		if(!player1.alive) return;
		if(this.col.polygonIntersections(player1.col).length > 0)
			this.hitPlayer();
	}
	vehicleCollide(veh){
		var force = veh.vel.minus(this.vel).distance();
		var origin = this.pos.plus(veh.pos).multiply(0.5);
		var tpush = origin.minus(veh.pos).normalized(-force);
		var vpush = origin.minus(this.pos).normalized(-force);
		
		veh.kill(tpush);
		this.kill(vpush);
	}
	hitPlayer(){
		if(this.vel.distance() < 1)
			return;
		player1.kill(this.vel);
		this.kill();
	}
	
	kill(push = new vec2()){
		this.vel = this.vel.multiply(0.5);
		if(push.distance() > 0.01)
			this.vel = this.vel.plus(push);
		this.speed = 0;
		
		var rot = push.distance() / 100;
		this.deathRotVel = rand(-rot, rot)
		
		if(this.alive){
			activeCars -= 1;
			deathtoll += 1;
		}
		this.alive = false;
	}
	remove(){
		vehicles.splice(vehicles.indexOf(this), 1);
		this.closeSkidMarks();
		if(this.alive)
			activeCars -= 1;
	}

	deathUpdate(){
		
		this.vel = this.vel.multiply(0.8);
		this.deathRotVel *= 0.9;
		this.pos = this.pos.plus(this.vel);
		this.moveDir += this.deathRotVel;
		this.alignCollision();
		this.handleCollisions();
		this.removeCheck();
	}
	removeCheck(){
		if((this.pos.x > canvas.width + this.graphic.width) ||
			(this.pos.x < 0 - this.graphic.width) ||
			(this.pos.y < 0 - this.graphic.width) ||
			(this.pos.y > canvas.height + this.graphic.width))
			this.remove();
	}
	
	update(){
		if(!this.skidding)
			this.closeSkidMarks();
		this.skidding = false;
		
		if(!this.alive){
			this.deathUpdate();
			return;
		}
		
		this.handleSteeringPhysics();
		this.pos = this.pos.plus(this.vel);
		this.alignCollision();
		this.handleCollisions();
		
		this.removeCheck();
		
		this.drive();
	}
	draw(ctx){}
	draw_debug(ctx = context){
		this.col.drawOutline(ctx, "#FFF", 2);
		this.getPotentialCollisions();
	}
}

class car extends vehicle{
	constructor(){
		var speed = rand(5, 10);
		super(speed);
		this.sprite = new box(
			0, this.graphic.height / 5 * Math.floor(rand(0, 5)), 
			this.graphic.width, this.graphic.height / 5 );
	}
	get graphic(){
		return car.graphic;
	}
	
	setCollision(){
		// called in super.constructor()
		var verts = [
			new vec2(15, -14),
			new vec2(28, -4),
			new vec2(28, 4),
			new vec2(15, 14),
			new vec2(-23, 14),
			new vec2(-28, 8),
			new vec2(-28, -8),
			new vec2(-23, -14)
			];
		
		this.col = new polygon();
		this.col.setVerts(verts);
		this.alignCollision();
	}
	
	getSkidLPos(){
		return this.col.getAbsVerts()[0];
	}
	getSkidRPos(){
		return this.col.getAbsVerts()[3];
	}
	
	update(){
		super.update();
	}
	draw(ctx){
		drawImage(ctx, 
			this.graphic, 
			this.pos, 
			this.moveDir, 
			this.sprite );
	}
	
	static loadGraphics(){
		car.graphic = new Image();
		car.graphic.src = "./gfx/car.png";
	}
}

car.loadGraphics();