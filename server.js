var Hapi        =   require('hapi')
var Good        =   require("good")
var Vision      =   require("vision")
var mySQL       =   require('mysql')
var Joi         =   require('joi')
var bcrypt      =   require('bcrypt')

var server      =   new Hapi.Server()

var conc = mySQL.createConnection({
    host:"localhost",
    user:"root",
    password:"New@12345",
    database:"user",
    });
    
 conc.connect(function(err){
     if(err) throw err
     console.log("mysql connected to user")

 })
 
 server.connection({
    port:3000,
    host:'localhost',
    routes: {
        cors: true
    }
 })


 server.register(
     [{
            register:Vision
    },
   
    {
        register:Good,
        options:{ 
            ops:{
                interval:10000
            },
            reporters:{
                    console:[
                        {
                        module:'good-squeeze',
                        name:'Squeeze',
                        args:[{log:'*',response:'*',request:'*'}]
                },
                {
                    module:'good-console'
                },
                'stdout'
            ]
        }
    
    }
}
],function(err){
    if(err) {console.log('error',"failed to install plugins")
    throw err;
}

server.log("info","plugins registered")


server.route([
    {
        method:['POST'],
        path:'/signup',
        config:{
           handler: function(request,reply){ 
            console.log(request.payload)

            var email = request.payload.email;
            var password = request.payload.password;
            
            var hash = bcrypt.hashSync(password,10)

            var sql ="INSERT INTO userdata (email,password) VALUES ('"+email+"','"+hash+"');"
            conc.query(sql,function(err,result){

                    if(err){ 
                       console.log ("record already in the database");
                         reply({success:false,message:"already present in database"})
                    
                    } else {
                    console.log("1 record inserted")
                    reply({sucess:true,message:"user inserted data"})    }
                  })

        },
        description:"post user data",
        tags:['api'],
        validate:{
            payload:{
                email:Joi.string().required(),
                password:Joi.string().min(3).max(8).required()
            }
           }
        }
    },
    {
        method:['POST'],
        path:'/login',
        config:{
           handler: function(request,reply){
            console.log(request.params)

            var email = request.payload.email;
            var password = request.payload.password;
            console.log(`data inserted by user is --> user=${email} ,password=${password}`);
            var sql1 ="select * from userdata;"
            
            conc.query(sql1,function(err,result){
                    for(var user of result){
                        if(email==user.email){
                            console.log(user.email);
                            bcrypt.compare(password,user.password,function(error,res){
                                console.log(res);
                                console.log(error);
                                            if(error) {
                                                console.log(err)
                                                reply({sucess:false,message:"password is incorrect"})
                                                throw error
                                            } else if (res){
                                                console.log("authentication succesful")
                                                reply({sucess: true,msg:"Authentication successful,logged in"})
                                                
                                            } else {
                                                reply({sucess:false,message:"password or email is incorrect"})
                                            }
                              })
                        }
                    }
                    if(err) throw err;
                  })
                }
            }
       },
 ]
)
})

server.start( function(err){
        if(err) throw err
    console.log('server running at'+server.info.uri);
})
