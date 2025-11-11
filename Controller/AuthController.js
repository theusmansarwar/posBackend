const jwt = require("jsonwebtoken");
const User = require("../Models/UserModel");

// 🔹 LOGIN API (No bcrypt)
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        status: 400,
        message: "Email and password are required.",
      });
    }

    // ✅ Find user
    const user = await User.findOne({ email }).populate("role", "name description Modules");
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found.",
      });
    }

    // ✅ Check if user is active
    if (!user.status) {
      return res.status(403).json({
        status: 403,
        message: "Your account is inactive. Contact admin.",
      });
    }

    // ✅ Compare plain password
    if (user.password !== password) {
      return res.status(401).json({
        status: 401,
        message: "Invalid email or password.",
      });
    }

    // ✅ Generate JWT Token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role?.name },
      process.env.JWT_SECRET || "mysecretkey",
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      status: 200,
      message: "Login successful!",
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      status: 500,
      message: "Something went wrong during login",
      error: error.message,
    });
  }
};

module.exports = { loginUser };
