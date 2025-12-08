'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tenants', 'Room_Type', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('tenants', 'Room_Number', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn('tenants', 'Monthly_Rent', {
      type: Sequelize.DECIMAL,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('tenants', 'Room_Type');
    await queryInterface.removeColumn('tenants', 'Room_Number');
    await queryInterface.removeColumn('tenants', 'Monthly_Rent');
  }
};
