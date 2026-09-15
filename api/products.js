import { db } from 'hatchable';
export const access='public';
export const methods=['GET'];
export default async function(req,res){
  const {rows}=await db.query("SELECT id,name,description,category,price,unit,image_url,stock,availability,discount FROM products ORDER BY name");
  res.json(rows);
}
