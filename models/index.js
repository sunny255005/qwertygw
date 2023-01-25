const fs = require("fs")
const { Pool } = require('pg');
const {isEqual} = require("lodash");

const config = JSON.parse(fs.readFileSync(process.env.CONFIG_FILE_PATH) || '{}');
let pool;
const multipleConnPool={};

(async ()=>{
  try{
    pool = new Pool({
      user: config["dbConfig"]["user"],
      host: config["dbConfig"]["host"],
      database: config["dbConfig"]["database"],
      password: config["dbConfig"]["password"],
      port: config["dbConfig"]["port"],
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 120000,
    });
    
    const client=await pool.connect();
    // pool.connect().then(client => {
    const sql="SELECT organization_id,db_conn_info FROM mihup.organization;"
    client.query(sql).then(res => {
        let rows=res.rows || [];
        let uniqueConnInfoArray=[];
        rows.forEach(conn =>{
         conInfo = conn.db_conn_info;
         let uniqueConnInfo=uniqueConnInfoArray.find(uconn=>{
          return isEqual(uconn.conInfo,conInfo);
         })
         if(!uniqueConnInfo){
           uniqueConnInfoArray.push({orgIds:[conn.organization_id],conInfo})
         }else{
           uniqueConnInfo.orgIds.push(conn.organization_id);
         }
        })
    
        uniqueConnInfoArray.forEach(async uniqueConn=>{
          try{
            const conInfo=uniqueConn.conInfo;
            if(!conInfo.username || !conInfo.host || !conInfo.databaseName || !conInfo.password || !conInfo.port){
              uniqueConn.orgIds.forEach(orgId=>multipleConnPool[orgId]=pool);
              return ;
            }
            const newPool = new Pool({
              user: conInfo["username"],
              host: conInfo["host"],
              database: conInfo["databaseName"],
              password: conInfo["password"],
              port: conInfo["port"],
              max: 20,
              idleTimeoutMillis: 30000,
              connectionTimeoutMillis: 2000,
            });
          newPool.on('error', (err) => {
              console.error('Unexpected error on idle client', err);
              uniqueConn.orgIds.forEach(orgId=>delete multipleConnPool[orgId])
          });
          uniqueConn.orgIds.forEach(orgId=>multipleConnPool[orgId]=newPool);
        }catch(uniqueErr){
          console.log("Error",uniqueErr);
        }
        })
      }).catch(err => {
        client.release(true);
        console.log(err)
      });
    // });
    // error handler
    pool.on('error', (err, client) => {
      console.error('Unexpected error on idle client', err);
    });
    
  
  }catch(err){
    console.log(err);
  }
})();

const pushIntoPool=async(orgId,dbInfo)=>{
  const newPool = new Pool({
    user: dbInfo["username"],
    host: dbInfo["host"],
    database: dbInfo["databaseName"],
    password: dbInfo["password"],
    port: dbInfo["port"],
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  newPool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
  multipleConnPool[orgId]=newPool;
}

module.exports = { pool,multipleConnPool,pushIntoPool }
