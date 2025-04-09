import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import ejs from "ejs";
import bodyParser from "body-parser";
import nodemailer from "nodemailer";
import _ from "lodash";

const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set("view engine" , "ejs");

// Establishing connection with MongoDBatlas and creating db stuffs

mongoose.connect("mongodb+srv://"+process.env.USERNAME+":"+process.env.PASSWORD+"@webdevcluster.xr1x8.mongodb.net/TravelBlogDB");

const CommentSchema = new mongoose.Schema({
    comment:String,
    date:String
});

const Comment = mongoose.model("comment" , CommentSchema);

const PostSchema = new mongoose.Schema({
    postTitle : {
        type:String,
        requried:true
    } ,
    postContent:{
        type:String,
        requried:true
    },
    postDate:String,
    comments:[CommentSchema]
});

const Post = mongoose.model("post",PostSchema);

// Get Route

app.get("/" , (req,res)=>{

    Post.find()
    .then((posts)=>{
        res.render("blog.ejs",{posts:posts});
    });
   
});

app.get("/posts/:postTitle" , (req,res)=>{
 
    var posttitle = _.lowerCase(req.params.postTitle);
  
    Post.find()
    .then((postItems)=>{
           postItems.forEach((post)=>{
                 var postName = _.lowerCase(post.postTitle);
                 if(posttitle === postName){
                    res.render("singlepost.ejs", {post:post});
                }
           });
        });

});

// Post Routes

app.post("/compose" , (req,res)=>{

    const date = new Date().toDateString();

  const post = new Post({
    postTitle : req.body.postTitle,
    postContent: req.body.postContent,
    postDate:date
  });
 
  post.save()
  .then(()=> res.redirect("/"));

});


//Sending emails to owner of the site via smtp connection

app.post("/contact" , (req,res)=>{

 var email=req.body.Email;
 
    var transporter = nodemailer.createTransport({
        service:"gmail",
        host:'smtp.gmail.com',
        port:'465',
        secure: true,
          auth: {
              user: process.env.EMAIL, // your email address to send email from
              pass: process.env.PASS // your gmail account password
          }
         });
    
        const mailOptions = {
          from: email, // sender address
          to: process.env.EMAIL, // list of receivers
          subject: "You have a Mail from " + req.body.Name  +" on Travel blog site contact form", // Subject line
          html: `<body>
          <p>You have a new messages.</p>
          <h3>Contact Details</h3>s
          <ul>
            <li>Name: ${req.body.Name} </li>
            <li>Email: ${email}</li>
            <li>Message: ${req.body.Message}</li>
          </ul>
          </body>`
        };
    
        transporter.sendMail(mailOptions, function (err, info) {
          if (err) {
            res.status(500).send({
              success: false,
              message: 'Something went wrong. Try again later after sometime'
            });
            console.log(err);
          } else {
            res.send({
              success: true,
              message: 'Thanks for contacting us. We will get back to you shortly'
            });
          }
        });
      transporter.close();
});

app.post("/comment",(req,res)=>{

  const date = new Date().toDateString();

  const comment = new Comment({
    comment : req.body.comment,
    date:date
  });

  Post.findOne({postTitle:req.body.post})
  .then((foundPost)=>{
foundPost.comments.push(comment);
foundPost.save()
.then(()=> res.redirect("/posts/"+req.body.post));
  });

});

app.listen(3000,()=>console.log("server started at port 3000"));


