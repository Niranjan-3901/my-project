const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require("dotenv").config()

mongoose.connect(process.env.MONGO_DB_URI)
  .then()
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1); // Exit the process with a failure
  });

const ProductSchema = new Schema({
  availability: {
    type: String,
    required: [true, 'Availability is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required']
  },
  company: {
    type: String,
    required: [true, 'Company is required']
  },
  discount: {
    type: Number,
  },
  _id: {
    type: Number,
    required: [true, 'ID is required'],
    unique: true
  },
  price: {
    type: Number,
    required: [true, "Price is required"]
  },
  productName: {
    type: String,
    required: [true, "Product name is required"]
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required']
  },
});

const CompanySchema = new Schema({
  description:{
    type: String,
    required : [true,"Description is required"]
  },
  _id:{
    type: Number,
    required: [true, "Id is required"],
    unique: true
  },
  name:{
    type: String,
    required: [true,"Name is required"]
  }
})

const CategorySchema = new Schema({
  _id:{
    type: Number,
    required: [true, "Id is required"],
    unique: true
  },
  name:{
    type: String,
    required: [true,"Name is required"]
  }
})

const Products = mongoose.model('Product', ProductSchema);
const Company = mongoose.model('Company',CompanySchema);
const Category = mongoose.model('Category',CategorySchema);

module.exports = {Products, Company, Category};
