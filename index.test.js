const app=require("./index")


const supertest = require('supertest');



//     describe("/health",()=>{

//         test("Should respond a status code 200",async  ()=>{
//             const response=await request.get("/health").send({
                
//             })
//             expect(response.text).toBe("Ok")
//             expect(response.statusCode).toBe(200)
            
//         })
//     })

test("GET /health", async () => {
  //  const post = await Post.create({ title: "Post 1", content: "Lorem ipsum" });
  
    // await supertest(server).get("/health")
    //   .expect(200)
    
                    const response=await supertest(app).get("/health").send({
                        
                    })
                    expect(response.text).toBe("Ok")
                    expect(response.statusCode).toBe(200)
                    
             
      
  });
