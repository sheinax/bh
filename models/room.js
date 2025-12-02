'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Room extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Room.init({
    Room_Number: DataTypes.INTEGER,
    Room_Type: DataTypes.STRING,
    Rent_Amount: DataTypes.DECIMAL,
    Availability_Status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Room',
  });
  return Room;
};