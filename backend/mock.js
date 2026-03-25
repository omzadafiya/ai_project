const mongoose = require('mongoose');
const leadSchema = new mongoose.Schema({
    phoneId: String,
    location: String,
    budget: String,
    propertyType: String,
    status: { type: String, default: 'Qualified' },
    createdAt: { type: Date, default: Date.now }
});
const Lead = mongoose.model('Lead', leadSchema);

async function mock() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/smartRealEstate');
        await Lead.deleteMany({});
        await Lead.create([
            { phoneId: "919876543210", location: "Andheri West", budget: "45,000", propertyType: "2BHK", status: "New" },
            { phoneId: "919904362053", location: "Bandra", budget: "80,000", propertyType: "3BHK", status: "Qualified" },
            { phoneId: "918888888888", location: "Surat", budget: "1,20,000", propertyType: "Commercial", status: "Contacted" }
        ]);
        console.log("Mock data inserted!");
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
mock();
