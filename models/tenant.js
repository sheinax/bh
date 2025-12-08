module.exports = (sequelize, DataTypes) => {
    const tenant = sequelize.define('tenant', { 
        Users_ID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        FirstName: { type: DataTypes.STRING, allowNull: false },
        LastName: { type: DataTypes.STRING, allowNull: false },
        Address: { type: DataTypes.STRING, allowNull: false },
        Users_Gender: { type: DataTypes.STRING, allowNull: false },
        ContactNumber: { type: DataTypes.STRING, allowNull: false },
        Room_Type: { type: DataTypes.STRING, allowNull: false },
        Room_Number: { type: DataTypes.INTEGER, allowNull: false },
        Monthly_Rent: { type: DataTypes.DECIMAL(10,2), allowNull: false },
        Users_Status: { type: DataTypes.STRING, defaultValue: "Active" },
        Username: { type: DataTypes.STRING, allowNull: false, unique: true },
        Password: { type: DataTypes.STRING, allowNull: false },
    });
    return tenant;
};
