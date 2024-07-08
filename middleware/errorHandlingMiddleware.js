const errorMiddleware =(error,req,res,next)=>{

    const status=error.status
    const message=error.message
    if(status==404){
        res.render('404',{status:404, error:message})
    }else{
        res.render('404',{status:500, error:message})
    }

} 

module.exports = errorMiddleware