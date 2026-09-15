import { db } from 'hatchable';
export const access='admin';
export const methods=['GET','POST','PUT','DELETE'];
export default async function(req,res){
  if(req.method==='GET'){
    const {rows}=await db.query("SELECT * FROM products ORDER BY name");
    return res.json(rows);
  }
  const b=req.body||{};
  if(req.method==='POST'){
    const {name,description='',category='All Fruits',price,unit='kg',image_url,stock=0,availability=true,discount=0}=b;
    if(!name||price===undefined||!image_url)return res.status(400).json({error:'name, price and image_url are required'});
    const {rows}=await db.query("INSERT INTO products (name,description,category,price,unit,image_url,stock,availability,discount) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",[name,description,category,price,unit,image_url,stock,availability,discount]);
    return res.json(rows[0]);
  }
  const id=req.query?.id;
  if(!id)return res.status(400).json({error:'Product id is required'});
  if(req.method==='PUT'){
    const {name,description,category,price,unit,image_url,stock,availability,discount}=b;
    const {rows}=await db.query("UPDATE products SET name=$1,description=$2,category=$3,price=$4,unit=$5,image_url=$6,stock=$7,availability=$8,discount=$9,updated_at=now() WHERE id=$10 RETURNING *",[name,description,category,price,unit,image_url,stock,availability,discount,id]);
    return res.json(rows[0]);
  }
  await db.query("DELETE FROM products WHERE id=$1",[id]);
  return res.json({ok:true});
}
