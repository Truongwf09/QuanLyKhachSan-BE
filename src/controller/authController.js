const service = require("../services/authService");

exports.login = async (req, res) => {
    try {
        console.log("Body:", req.body);

        const result = await service.login(req.body);

        res.json(result);

    } catch (err) {

        console.error("===== LOGIN ERROR =====");
        console.error(err);
        console.error(err.stack);

        res.status(err.status || 500).json({
            message: err.message,
        });
    }
}; 