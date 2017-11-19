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
		this.steer = 0;
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
		this.steer *= 0.9;
		if(rand() > 0.9)
			this.steer += rand(-1, 1);
		
		var pcols = this.getPotentialCollisions();
	}
	getPotentialCollisions(){
		var m = [];
		
		return m;
	}
	accelerate(){
		var acc = 0.35;
		var dVel = vec2.fromAng(this.moveDir, acc);
		
		//ensure the vehicle doesn't pass its predetermined speed
		var fSpd = this.vel.plus(dVel).distance();
		if(fSpd > this.speed)
			dVel = vec2.fromAng(this.moveDir, this.speed - fSpd);
		
		this.vel = this.vel.plus(dVel);
	}
	brake(){
		this.vel = this.vel.multiply(0.785);
		this.doSkidEffect();
	}
	swerve(direction){
		
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
	checkVehicleCollisions(){
		for(var i = vehicles.length - 1; i >= 0; i--){
			if(this.id === vehicles[i].id)
				continue;
			if(this.col.polygonIntersections(vehicles[i].col).length > 0){
				this.vehicleCollide(vehicles[i]);
			}
		}
	}
	checkPlayerCollision(){}
	vehicleCollide(veh){
		this.kill();
		veh.kill();
	}
	
	kill(push = new vec2()){
		this.vel = this.vel.plus(push);
		this.alive = false;
	}
	remove(){
		vehicles.splice(vehicles.indexOf(this), 1);
		this.closeSkidMarks();
	}

	deathUpdate(){
		this.vel = this.vel.multiply(0.8);
		this.pos = this.pos.plus(this.vel);
		this.handleCollisions();
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
		
		if((this.pos.x > canvas.width + this.graphic.width) ||
			(this.pos.x < 0 - this.graphic.width))
			this.remove();
		
		this.drive();
	}
	draw(ctx){}
	draw_debug(ctx = context){
		this.col.drawOutline(ctx, "#FFF", 2);
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