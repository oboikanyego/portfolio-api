const EmailTemplate = require('../models/email-template.model');
const { seedEmailTemplates } = require('../config/email-template-seeds');
const { VALID_KEYS, validateFields, renderTemplate, previewValues } = require('../services/email-template.service');
const keys = Array.from(VALID_KEYS);
const select = { _id:0, key:1, name:1, subjectTemplate:1, htmlTemplate:1, allowedVariables:1, updatedAt:1 };

exports.listTemplates = async (_req, res) => {
  try {
    const data = await EmailTemplate.find({key:{$in:keys}}).select(select).sort({key:1}).lean();
    res.set('Cache-Control','no-store');
    return res.json({success:true, templates:data});
  } catch (error) {
    console.error('Email template listing failed:',error.message);
    return res.status(500).json({success:false,message:'Unable to load email templates.'});
  }
};
exports.previewTemplate = async (req,res) => {
  try {
    const key=req.params.key;
    if(!VALID_KEYS.has(key)) return res.status(404).json({success:false,message:'Unknown template.'});
    const row=await EmailTemplate.findOne({key}).select(select).lean();
    if(!row) return res.status(404).json({success:false,message:'Template missing.'});
    const subjectTemplate=typeof req.body?.subjectTemplate==='string'?req.body.subjectTemplate:row.subjectTemplate;
    const htmlTemplate=typeof req.body?.htmlTemplate==='string'?req.body.htmlTemplate:row.htmlTemplate;
    validateFields(key,subjectTemplate,htmlTemplate);
    const output=renderTemplate({...row,subjectTemplate,htmlTemplate},
      Object.fromEntries(row.allowedVariables.map(name=>[name,previewValues[name] || ''])));
    res.set('Cache-Control','no-store');
    return res.json({success:true,...output});
  } catch(error) {
    return res.status(400).json({success:false,message:error.message});
  }
};
exports.updateTemplate = async (req,res) => {
  const key=req.params.key;
  if(!VALID_KEYS.has(key)) return res.status(404).json({success:false,message:'Unknown template.'});
  const subjectTemplate=req.body?.subjectTemplate;
  const htmlTemplate=req.body?.htmlTemplate;
  try { validateFields(key,subjectTemplate,htmlTemplate); }
  catch(error){ return res.status(400).json({success:false,message:error.message}); }
  const stamp=req.body?.expectedUpdatedAt;
  if(typeof stamp!=='string'|| !Number.isFinite(Date.parse(stamp))) {
    return res.status(400).json({success:false,message:'Expected update version is required. Reload the editor.'});
  }
  try {
    // Mongoose timestamps create an optimistic write guard: stale tabs cannot
    // overwrite newer MongoDB template edits.
    const result=await EmailTemplate.findOneAndUpdate(
      {key,updatedAt:new Date(stamp)},{$set:{subjectTemplate,htmlTemplate}},
      {new:true,runValidators:true,projection:select}
    ).lean();
    if (!result) return res.status(409).json({
      success:false,message:'This email template was updated elsewhere. Reload before saving.'
    });
    res.set('Cache-Control','no-store');
    return res.json({success:true,template:result});
  } catch(error) {
    console.error('Template update failed:',error.message);
    return res.status(500).json({success:false,message:'Unable to save the email template.'});
  }
};
