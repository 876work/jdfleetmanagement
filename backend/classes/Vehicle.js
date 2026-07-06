export class Vehicle {
    constructor(id, plateNumber, brand, model, year, categoryId, ownerId, name = '', status = 'active', notes = '', dateAdded = new Date()) {
      this.id = id;
      this.name = name;
      this.plateNumber = plateNumber;
      this.brand = brand;
      this.model = model;
      this.year = year;
      this.categoryId = categoryId;
      this.ownerId = ownerId;
      this.status = status;
      this.notes = notes;
      this.dateAdded = dateAdded;
    }
  }
