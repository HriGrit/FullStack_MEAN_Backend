import { Department } from "../models/departmentModel.js"
import { DoctorModel } from "../models/doctorModel.js";
import { User } from "../models/userModel.js";
import { hashPassword,comparePasswords } from "../services/hashServices.js";
// For Department Management


export const adminDashboard=(req,res)=>{
  res.status(200).json({
    "msg":"Welcome to Admin DashBoard"
  })
}

export const createDepartment = async (req, res) => {
  let { name } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ msg: 'Name is required and must be a string' });
  }

  name = name.trim().toUpperCase();

  try {
    const existing = await Department.findOne({ name });
    if (existing) {
      return res.status(409).json({ msg: 'Department already exists' });
    }

    await Department.create({ name });

    res.status(201).json({
      msg: 'Department created successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Something went wrong' });
  }
};




export const updateDepartment = async (req, res) => {
    console.log("Update Department Called");
  const { id } = req.params;           
  let { name } = req.body;   
  name=name.toUpperCase();        

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ msg: 'Name is required and must be a string' });
  }

  try {
    const existing = await Department.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ msg: 'Department with this name already exists' });
    }

    const updated = await Department.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ msg: 'Department not found' ,
            Success:false
      }
    
      );
    }

    res.status(200).json({
      msg: 'Department updated successfully',
      Success:true
    });
  } catch (error) {
    res.status(500).json({ msg: 'Something went wrong' });
  }
};


export const deleteDepartment = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Department.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ msg: 'Department not found', Success:false });
    }

    res.status(200).json({ msg: 'Department deleted successfully', Success:true });
  } catch (error) {
    res.status(500).json({ msg: 'Something went wrong' });
  }
};

//Doctor Operations

export const createDoctor = async (req, res) => {
  const { name, email, password, phone, specialization, deptName, availability } = req.body;

  // Check required fields
  if (!name || !email || !password || !specialization || !deptName) {
    return res.status(400).json({ msg: 'Missing required fields' });
  }

  try {
    // Convert deptName to uppercase (assuming your DB stores uppercase)
    const deptNameUpper = deptName.trim().toUpperCase();

    // Find department by uppercase name
    const department = await Department.findOne({ name: deptNameUpper });
    if (!department) {
      return res.status(404).json({ msg: 'Department not found' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ msg: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create User with role DOCTOR
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'DOCTOR'
    });

    const newDoctor = await DoctorModel.create({
      userId: newUser._id,
      deptId: department._id,
      specialization,
      availability
    });

    res.status(201).json({
      msg: 'Doctor created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      doctor: {
        id: newDoctor._id,
        specialization: newDoctor.specialization,
        availability: newDoctor.availability,
        deptName: department.name // return uppercase department name
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Something went wrong', error: error.message });
  }
};

export const updateDoctor = async (req, res) => {
  const { doctorId } = req.params; // doctor _id
  const { name, email, password, phone, specialization, deptName, availability } = req.body;

  try {
    const doctor = await DoctorModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ msg: 'Doctor not found' });
    }

    // Find user linked to doctor
    const user = await User.findById(doctor.userId);
    if (!user) {
      return res.status(404).json({ msg: 'Associated user not found' });
    }

    // Update department if deptName provided
    let department;
    if (deptName) {
      const deptNameUpper = deptName.trim().toUpperCase();
      department = await Department.findOne({ name: deptNameUpper });
      if (!department) {
        return res.status(404).json({ msg: 'Department not found' });
      }
      doctor.deptId = department._id;
    }

    // Update doctor fields
    if (specialization) doctor.specialization = specialization;
    if (availability) doctor.availability = availability;

    // Update user fields
    if (name) user.name = name;
    if (email) {
      // Check if email already exists on another user
      const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
      if (emailExists) {
        return res.status(409).json({ msg: 'Email already in use' });
      }
      user.email = email;
    }
    if (phone) user.phone = phone;

    if (password) {
      const hashedPassword = await hashPassword(password);
      user.password = hashedPassword;
    }

    await doctor.save();
    await user.save();

    res.status(200).json({
      msg: 'Doctor updated successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      doctor: {
        id: doctor._id,
        specialization: doctor.specialization,
        availability: doctor.availability,
        deptName: department ? department.name : undefined
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Something went wrong', error: error.message });
  }
};

export const deleteDoctor = async (req, res) => {
  const { doctorId } = req.params;


  try {
    const doctor = await DoctorModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ msg: 'Doctor not found' });
    }

    // Delete user associated
    await User.findByIdAndDelete(doctor.userId);

    // Delete doctor profile
    await DoctorModel.findByIdAndDelete(doctorId);

    res.status(200).json({ msg: 'Doctor and associated user deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Something went wrong', error: error.message });
  }
};
