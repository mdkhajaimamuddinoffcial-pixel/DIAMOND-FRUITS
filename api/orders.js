import { db, email } from 'hatchable';
export const access='public';
export const methods=['POST'];

export default async function(req,res){
  try{
    const b=req.body||{};
    const {customer_name,phone,email:customerEmail,address,city,state,pincode,notes='',payment_method='cod',items=[]}=b;
    if(!customer_name||!phone||!customerEmail||!address||!city||!state||!pincode||!Array.isArray(items)||!items.length)
      return res.status(400).json({error:'Complete customer details and at least one cart item are required'});
    const ids=items.map(x=>x.product_id).filter(Boolean);
    if(!ids.length)return res.status(400).json({error:'Invalid cart'});
    const {rows:ps}=await db.query("SELECT id,name,price,unit,stock,availability FROM products WHERE id = ANY($1::uuid[])",[ids]);
    if(ps.length!==ids.length)return res.status(400).json({error:'One or more fruits are no longer available'});
    let subtotal=0,lines=[];
    for(const item of items){
      const p=ps.find(x=>x.id===item.product_id),q=Number(item.quantity);
      if(!p||!Number.isFinite(q)||q<=0||q>Number(p.stock)||!p.availability)return res.status(400).json({error:`${p?.name||'Product'} is unavailable or quantity exceeds stock`});
      const line=Number(p.price)*q; subtotal+=line;
      lines.push({product_id:p.id,product_name:p.name,quantity:q,unit:p.unit,price:Number(p.price),subtotal:line});
    }
    const delivery_fee=subtotal>=500?0:40,total=subtotal+delivery_fee,order_number='DF-'+Date.now().toString().slice(-8);
    const r=await db.query("INSERT INTO orders (order_number,customer_name,phone,email,address,city,state,pincode,notes,subtotal,delivery_fee,total,payment_method,payment_status,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id,order_number",[order_number,customer_name,phone,customerEmail,address,city,state,pincode,notes,subtotal,delivery_fee,total,payment_method,'pending','pending']);
    const order=r.rows[0];
    for(const line of lines){
      await db.query("INSERT INTO order_items (order_id,product_id,product_name,quantity,unit,price_at_purchase,subtotal) VALUES ($1,$2,$3,$4,$5,$6,$7)",[order.id,line.product_id,line.product_name,line.quantity,line.unit,line.price,line.subtotal]);
      await db.query("UPDATE products SET stock=stock-$1,updated_at=now() WHERE id=$2",[line.quantity,line.product_id]);
    }
    const textItems=lines.map(x=>`${x.product_name} — ${x.quantity} ${x.unit} — ₹${x.price.toFixed(0)} — ₹${x.subtotal.toFixed(0)}`).join('\n');
    let emailSent=true;
    try{await email.send({to:'diamondfruitscompanyoffcial@gmail.com',subject:`NEW ORDER — DIAMOND FRUITS — ${order_number}`,text:`DIAMOND FRUITS — NEW ORDER\nOrder ID: ${order_number}\nCustomer: ${customer_name}\nPhone: ${phone}\nEmail: ${customerEmail}\nAddress: ${address}, ${city}, ${state} - ${pincode}\n\nItems:\n${textItems}\n\nSubtotal: ₹${subtotal.toFixed(0)}\nDelivery: ₹${delivery_fee.toFixed(0)}\nGrand Total: ₹${total.toFixed(0)}\nPayment: ${payment_method}\nStatus: pending\nNotes: ${notes||'None'}`});}catch(_){emailSent=false;}
    res.json({ok:true,order_number,total,payment_status:'pending',email_sent:emailSent});
  }catch(e){console.error(e);res.status(500).json({error:'Unable to place order right now. Please try again.'});}
}
