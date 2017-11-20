class effect{
	constructor(){
		
	}
	
	add(){
		effects.push(this);
	}
	remove(){
		effects.splice(effects.indexOf(this), 1);
	}
	
	update(){}
	draw(ctx){}
}

class skidMark extends effect{
	constructor(){
		super();
		this.points = [];
		this.color = {R:0, G:0, B:0};
		this.thickness = 3;
	}
	
	setColor(r, g, b){
		this.color = {
			R:r, G:g, B:b
		};
	}
	addPoint(position, alpha = 1){
		var point = {
			pos: position.clone(),
			A: alpha
		};
		this.points.push(point);
	}
	
	draw(ctx){
		ctx.lineWidth = this.thickness;
		for(var i = this.points.length - 1; i >= 1; i--){
			var cp = this.points[i];
			var np = this.points[i - 1];
			
			ctx.strokeStyle = "rgba(" 
				+ this.color.R.toString() + "," + 
				+ this.color.G.toString() + "," + 
				+ this.color.B.toString() + "," + 
				+ this.points[i].A.toString() + ")";
			ctx.beginPath();
			ctx.moveTo(cp.pos.x, cp.pos.y);
			ctx.lineTo(np.pos.x, np.pos.y);
			ctx.stroke();
		}
	}

}

class bloodSplatter extends effect{
	constructor(pos, type){
		super();
		var w = gfx.bloodEffects.width / 4;
		this.sprite = new box(
			w * type, 0, 
			w, gfx.bloodEffects.height);
		this.pos = pos.clone();
	}
	
	draw(ctx, ang = rand(-Math.PI, Math.PI)){
		drawImage(ctx, gfx.bloodEffects,
			this.pos, ang, this.sprite);
	}
}