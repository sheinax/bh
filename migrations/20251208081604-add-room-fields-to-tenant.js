module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tenants', 'Room_Type', { type: Sequelize.STRING, allowNull: false });
    await queryInterface.addColumn('tenants', 'Room_Number', { type: Sequelize.INTEGER, allowNull: false });
    await queryInterface.addColumn('tenants', 'Monthly_Rent', { type: Sequelize.DECIMAL(10,2), allowNull: false });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('tenants', 'Room_Type');
    await queryInterface.removeColumn('tenants', 'Room_Number');
    await queryInterface.removeColumn('tenants', 'Monthly_Rent');
  }
};
