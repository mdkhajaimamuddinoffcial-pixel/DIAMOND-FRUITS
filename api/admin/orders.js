import { db } from 'hatchable';
export const access='admin';
export const methods=['GET','PUT'];
export default async function(req,res){
  if(req.method==='GET'){
    const {rows}=await db.query("SELECT o.*, COALESCE(json_agg(json_build_object('product_name',i.product_name,'quantity',i.quantity,'unit',i.unit,'price',i.price_at_purchase,'subtotal',i.subtotal)) FILTER (WHERE i.id IS NOT NULL),'[]') AS items FROM orders o LEFT JOIN order_items i ON i.order_id=o.id GROUP BY o.id ORDER BY o.created_at DESC");
    return res.json(rows);
  }
  const {id,status}=req.body||{};
  const allowed=['pending','confirmed','preparing','out_for_delivery','delivered','cancelled'];
  if(!id||!status||!allowed.includes(status))return res.status(400).json({error:'Invalid order update'});
  const {rows}=await db.query("UPDATE orders SET status=$1 WHERE id=$2 RETURNING *",[status,id]);
  return res.json(rows[0]);
}
