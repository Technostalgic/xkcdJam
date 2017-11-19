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
		this.speed = speed;
	}
	get graphic(){
		return null; // meant for override
	}
	
	remove(){
		vehicles.splice(vehicles.indexOf(this), 1)
	}
	
	update(){
		this.pos = this.pos.plus(this.vel);
		
		if((this.pos.x > canvas.width + this.graphic.width) ||
			(this.pos.x < 0 - this.graphic.width))
			this.remove();
	}
	draw(ctx){}
}

class car extends vehicle{
	constructor(){
		var speed = rand(10, 15);
		super(speed);
		this.sprite = new box(
			0, this.graphic.height / 5 * Math.floor(rand(0, 5)), 
			this.graphic.width, this.graphic.height / 5 );
	}
	get graphic(){
		return car.graphic;
	}
	
	update(){
		super.update();
	}
	draw(ctx){
		drawImage(ctx, 
			this.graphic, 
			this.pos, 
			this.vel.direction, 
			this.sprite );
	}
	
	static loadGraphics(){
		car.graphic = new Image();
		car.graphic.src = "./gfx/car.png";
	}
}

car.loadGraphics();