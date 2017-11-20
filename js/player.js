class player{
	constructor(){
		this.sprite = new box(0, 0, player.graphic.width / 2, player.graphic.height);
		this.murderAnimSeq = 0;
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
	
	move(direction = dir.up, override = false){
		if(!this.alive) return;
		if(this.animSeq > 0) return;
		if(!override){
			if(this.outOfBounds()) return;
			if(this.pos.y < lanes[0] - 20 && deathtoll > 0) return;
		}
		
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
		
		setTimeout(endGame, 1000);
		
		var bloodfx = new bloodSplatter(this.pos, 0);
		bloodfx.draw(effectContext, this.deathVel.direction());
		
		var spin = push.distance() / 100;
		this.deathRotVel = rand(-spin, spin);
	}
	
	outOfBounds(){
		return 
			(this.pos.x < 0) ||
			(this.pos.y < 0) ||
			(this.pos.x > canvas.width) ||
			(this.pos.y > canvas.height);
	}
	boundaryCheck(){
		if(this.pos.x < 0)
			this.move(dir.right, true);
		if(this.pos.y < 0)
			this.move(dir.down, true);
		if(this.pos.x > canvas.width)
			this.move(dir.left, true);
		if(this.pos.y > canvas.height)
			this.move(dir.up, true);
	}
	
	update(){
		if(!this.alive) {
			this.deathUpdate();
			return;
		}
		if(this.pos.y < lanes[0] - 20 && deathtoll > 0){
			this.murdererUpdate();
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
			this.boundaryCheck();
		}
		this.alignCollision();
	}
	deathUpdate(){
		this.pos = this.pos.plus(this.deathVel);
		this.moveDir += this.deathRotVel;
		this.deathVel = this.deathVel.multiply(0.96);
		
		if(this.deathVel.distance() < 3){
			if(this.deathVel.distance() > 0){
				var bloodfx = new bloodSplatter(this.pos, 2);
				//bloodfx.draw(effectContext);
			}
			this.deathVel = new vec2();
			this.deathRotVel = 0;
		}
		else if(this.deathVel.distance() < 6){
			if(rand() > 0.6){
				var bloodfx = new bloodSplatter(this.pos, 3);
				//bloodfx.draw(effectContext);
			}
		}
	}
	murdererUpdate(){
		this.animSeq -= 1;
		if(this.animSeq > 0){
			var dPos = vec2.fromAng(this.moveDir, this.moveSize / this.animTime)
			this.pos = this.pos.plus(dPos);
			
			this.sprite.position.x = player.graphic.width / 2;
		}
		else{
			this.sprite.position.x = 0;
			this.boundaryCheck();
		}
		this.alignCollision();
		
		if(this.animSeq < - 10){
			var mxdir = this.pos.x > canvas.width / 2 ?
				dir.left : dir.right;
			
			switch(this.murderAnimSeq){
				case 0:
					this.move(dir.up, true);
					break;
				case 1:
					this.move(mxdir, true);
					break;
				case 2:
					this.move(dir.up, true);
					break;
				case 3:
					this.move(mxdir, true);
					break;
				case 4:
					this.move(dir.down, true);
					break;
			}
			this.murderAnimSeq += 1;
		}
	}
	
	draw(ctx){
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, 0, 0);
		drawImage(ctx, player.graphic, this.pos, this.moveDir, this.sprite);
		
		if(!this.alive){
			var bloodfx = new bloodSplatter(this.pos, 1);
			bloodfx.draw(ctx, this.moveDir);
		}
		
		if(this.murderAnimSeq >= 5 && this.animSeq <= -50 && this.alive){
			drawImage(ctx, gfx.frogTextLine,
				this.pos.plus(new vec2(-25, -15)));
			
			ctx.textAlign = "center";
			ctx.fillStyle = "#000";
			ctx.font = "16px xkcdScript";
			ctx.fillText("well, shit.", this.pos.x - 30, this.pos.y - 40);
			
			var blinkInterval = 1200;
			ctx.fillStyle = timeElapsed % blinkInterval < blinkInterval / 2 ? "#FFF" : "rgba(255, 255, 255, 0.2)";
			ctx.font = "24px xkcdScript";
			ctx.fillText("press 'spacebar' to try again", canvas.width / 2, canvas.height - 40);
		}
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