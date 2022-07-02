"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */

    await queryInterface.bulkInsert("Events", [
      {
        groupId: 1,
        venueId: 1,
        name: "Tennis Group First Meet and Greet",
        type: "Online",
        capacity: 10,
        price: 18.5,
        description: "The first meet and greet for our group! Come say hello!",
        startDate: "2021-11-19 20:00:00",
        endDate: "2021-11-19 21:00:00",
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */

    await queryInterface.bulkDelete("Events", {
      name: "Tennis Group First Meet and Greet",
    });
  },
};