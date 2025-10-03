import { Department } from "../models/departmentModel.js"

export const adminDashboard=(req,res)=>{
  res.status(200).json({
    "msg":"Welcome to Admin DashBoard"
  })
}

export const createDepartment = async (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ msg: 'Name is required and must be a string' });
  }

  try {
    const existing = await Department.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ msg: 'Department already exists' });
    }

    const newDepartment = await Department.create({ name: name.trim() });

    res.status(201).json({
      msg: 'Department created successfully'
    });
  } catch (error) {
    res.status(500).json({ msg: 'Something went wrong' });
  }
};
