class player{
	constructor(){
		this.sprite = new box(0, 0, player.graphic.width / 2, player.graphic.height);
		this.animSeq = 0;
		this.animTime = 10;
		this.moveSize = 40;
		this.moveDir = dir.up;
		this.pos = new vec2(canvas.width / 2, 440);
		this.deathVel = new vec2();
		this.deathRotVel = 0;
		this.alive = true;
		this.setCollision();
	}
	setCollision(){
		this.col = polygon.Circle(12, 8);
		this.alignCollision();
	}
	alignCollision(){
		this.col.setPosition(this.pos);
		this.col.setRotation(this.moveDir);
	}
	
	move(direction = dir.up){
		if(!this.alive) return;
		if(this.animSeq > 0) return;
		
		var coltest = new ray(this.pos.clone(), direction, this.moveSize);
		for(var i = vehicles.length - 1; i >= 0; i--)
			if(coltest.polygonCollision(vehicles[i].col).length > 0)
				if(vehicles[i].vel.distance() <= 1)
					return;
		
		this.animSeq = this.animTime;
		this.moveDir = direction;
	}
	
	kill(push = new vec2()){
		this.alive = false;
		this.deathVel = push;
		
		var spin = push.distance() / 100;
		this.deathRotVel = rand(-spin, spin);
	}
	
	update(){
		if(!this.alive) {
			this.deathUpdate();
			return;
		}
		if(this.animSeq > 0){
			var dPos = vec2.fromAng(this.moveDir, this.moveSize / this.animTime)
			this.pos = this.pos.plus(dPos);
			
			this.sprite.position.x = player.graphic.width / 2;
			
			this.animSeq -= 1;
			if(this.animSeq < 0)
				this.animSeq = 0;
		}
		else{
			this.sprite.position.x = 0;
		}
		this.alignCollision();
	}
	deathUpdate(){
		this.pos = this.pos.plus(this.deathVel);
		this.moveDir += this.deathRotVel;
		this.deathVel = this.deathVel.multiply(0.96);
		if(this.deathVel.distance() < 3){
			this.deathVel = new vec2();
			this.deathRotVel = 0;
		}
	}
	
	draw(ctx){
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, 0, 0);
		drawImage(ctx, player.graphic, this.pos, this.moveDir, this.sprite);
	}
	draw_debug(ctx = context){
		this.col.drawOutline(ctx, "#FFF", 2)
	}
	
	static loadGraphics(){
		player.graphic = new Image();
		player.graphic.src = "./gfx/frogger.png";
	}
}
player.loadGraphics();