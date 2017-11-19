class player{
	constructor(){
		this.sprite = new box(0, 0, player.graphic.width / 2, player.graphic.height);
		this.animSeq = 0;
		this.animTime = 10;
		this.moveSize = 40;
		this.moveDir = dir.up;
		this.pos = new vec2(canvas.width / 2, 442);
		this.alive = true;
	}
	
	move(direction = dir.up){
		if(!this.alive) return;
		if(this.animSeq > 0) return;
		
		this.animSeq = this.animTime;
		this.moveDir = direction;
	}
	
	kill(push = new vec2()){
		this.alive = false;
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
	}
	deathUpdate(){
		
	}
	
	draw(ctx){
		drawImage(ctx, player.graphic, this.pos, this.moveDir, this.sprite);
	}
	
	static loadGraphics(){
		player.graphic = new Image();
		player.graphic.src = "./gfx/frogger.png";
	}
}
player.loadGraphics();