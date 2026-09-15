import { db, email } from 'hatchable';
export const access='public';
export const methods=['POST'];
export default async function(req,res){
  try{
    const {name,email:sender,phone,message}=req.body||{};
    if(!name||!sender||!phone||!message)return res.status(400).json({error:'All contact fields are required'});
    await db.query("INSERT INTO contact_messages (name,email,phone,message) VALUES ($1,$2,$3,$4)",[name,sender,phone,message]);
    try{
      await email.send({to:'diamondfruitscompanyoffcial@gmail.com',subject:'New DIAMOND FRUITS Contact Message',html:`<h2>New Contact Message</h2><p><b>Name:</b> ${name}</p><p><b>Email:</b> ${sender}</p><p><b>Phone:</b> ${phone}</p><p><b>Message:</b> ${message}</p>`});
    }catch(_){}
    res.json({ok:true});
  }catch(e){res.status(500).json({error:'Unable to save message'});}
}
