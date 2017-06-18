var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require("body-parser");
var multer = require('multer');
var cloudinary = require('cloudinary');
var app_password = '1';
var Schema = mongoose.Schema

cloudinary.config({
	cloud_name: "alecsanderdiaz",
	api_key: "512959286273732",
	api_secret: "nWSCB_W5KbJgRinPzwUS97dFrq8"
})

var app = express();

mongoose.connect("mongodb://localhost/proyecto");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
var upload = multer({ dest: 'uploads/' })

var methodOverride = require('method-override')
app.use(methodOverride('_method'))
//app.use(express.methodOverride)

//Definir el esquema
// Video 26 hicimos el cambio
// var productSchema = {
// 	title:String,
// 	description:String,
// 	imageUrl:String,
// 	pricing:Number
// };
var productSchemaJSON = {
	title:String,
	description:String,
	imageUrl:String,
	pricing:Number
};

var productSchema = new Schema(productSchemaJSON)

productSchema.virtual('image.url').get(function(){
	if(this.imageUrl === undefined || this.imageUrl === "data.png"){
		return 'default.jpg'
	}
	return this.imageUrl
})

var Product = mongoose.model("Product", productSchema);

app.set("view engine", "jade");

app.use(express.static("public"));

app.get('/', function(req, res){
  res.render("index");
});

app.get("/menu", function(req, res){
	Product.find(function(error, documento){
		if (error) {console.log(error);}
		res.render("menu/index", {products: documento});
	});
});

app.put('/menu/:id', upload.single('image_avatar'), function(req, res)  {
	console.log(`Entro al put con contraseña: ${req.body.password}`)
	if(req.body.password == app_password){
		console.log("Entró al password")
		var data = {
			title: req.body.title,
			description: req.body.description,
			//imageUrl: "data.png",			
			pricing: req.body.pricing
		}

		if(req.file !== undefined)
		{
			console.log(`Entro a clodinary`)
			cloudinary.uploader.upload(req.file.path, 
				function(result) {
					console.log(result);
					data.imageUrl = result.url;
					Product.update({'_id': req.params.id}, data, (product) => {
						res.redirect('/menu')
					})
				}
			);


		}
		else
		{
			console.log(`Algo paso con la imagen`)
			Product.update({'_id': req.params.id}, data, (product) => {
				res.redirect('/menu')
			})
		}
		console.log(`El titulo Modificado es: ${req.body.title}`)
		console.log(`El id es: ${req.params.id}`)


	}
	else
	{
		console.log("se fue")
		res.redirect('/')
	}
})

app.get('/menu/edit/:id', (req, res) => {
	console.log(`Entró a editar el producto con id: ${req.params.id}`)
	var id_producto = req.params.id
	Product.findOne( { '_id': id_producto}, (err, product) => {
		if(err) throw err
		res.render("admin/edit", {product: product});
	})
})

app.post('/menu/edit/:id', (req, res) => res.redirect("/admin") )

app.post('/admin', (req, res) => {
	if(req.body.password == app_password){
		Product.find(function(error, documento){
			if (error) {console.log(error);}
			res.render("admin/index", {products: documento});
		});
	}
	else
	{
		console.log(`Contraseña Incorrecta: ${req.body.password}`)
		res.redirect('/')
	}
})

app.get('/admin', (req, res) => {
	console.log('Enttre por GET a Admin')
	res.render('admin/form')
})

app.post("/menu", upload.single('image_avatar'), function(req, res){
	if(req.body.password == app_password){
		console.log("Entró bien el password")
		var data = {
			title: req.body.title,
			description: req.body.description,
			//imageUrl: "data.png",
			pricing: req.body.pricing
		};
		
		var product = new Product(data);
		console.log("creó el producto");
		console.log(product);


		if(req.file !== undefined)
		{
					console.log("req.file.path: ");
		console.log(req.file.path);
			cloudinary.uploader.upload(req.file.path, 
			function(result) {
				console.log(result);
				product.imageUrl = result.url;
				product.save(function(err){
					console.log(product);
					res.redirect('/menu');
				});	
			}
		);
		} else
		{
			product.save(function(err){
					console.log(product);
					res.redirect('/menu');
				});	
		}
		

	} else {
		res.render("menu/error");
	}
});

app.get("/menu/new", (req, res) => {
	res.render("menu/new")
})

app.get('/menu/:id/delete', (req, res) => {
	var id = req.params.id;
	Product.findOne({'_id': id}, (err, producto) => {
		res.render('menu/delete', {producto: producto})
	})
})

app.delete('/menu/:id', (req, res) => {
	var id = req.params.id
	if(req.body.password == app_password){
		Product.remove({'_id': id}, (err) => {
			if (err) throw err
			res.redirect('/menu')
		})
	} else {
		res.render("menu");
	}
})

app.listen(8080);