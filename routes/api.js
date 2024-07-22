const express = require('express');
const router = express.Router();
const { Products, Company, Category } = require('../models/products');
const axios = require("axios");

const filterByPrice = (req, maxPrice) => {
  return { $gte: Number(req.query.minPrice) || 0, $lte: Number(req.query.maxPrice) || maxPrice };
};

const filterByRating = (req) => {
  return { $gte: Number(req.query.minRating) || 0, $lte: Number(req.query.maxRating) || 5 };
};

const queryMiddleware = async (req, res, next) => {
  try {
    const maxPriceData = await Products.aggregate([
      {
        $group: {
          _id: null,
          maxPrice: { $max: "$price" }
        }
      }
    ]);

    const maxPrice = maxPriceData.length > 0 ? maxPriceData[0].maxPrice : 0;

    let DB_filters = {
      "availability": req.query.availability || "",
      "price": filterByPrice(req, maxPrice),
      "rating": filterByRating(req)
    };

    DB_filters = Object.fromEntries(
      Object.entries(DB_filters).filter(([key, value]) => {
        return value !== undefined && value !== null && value !== '';
      })
    );

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let sortCriteria = {};
    if (req.query.sortOn) {
      const [field, order] = req.query.sortOn.split('-');
      sortCriteria[field] = order === 'desc' ? -1 : 1;
    }

    const totalCount = await Products.countDocuments(DB_filters);

    req.queryData = {
      DB_filters,
      page,
      limit,
      skip,
      sortCriteria,
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    };

    next();
  } catch (err) {
    console.error("Error in query middleware:", err);
    res.status(500).send("Error processing query parameters");
  }
};

router.use(['/products', '/category/:category/products', '/company/:company/products', '/company/:company/category/:category/products'], queryMiddleware);

router.get("/", (req, res) => {
  let html = `
    <html>
      <head>
        <title>API Documentation</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
          }
          h1 {
            color: #333;
          }
          a {
            text-decoration: none;
            color: #0066cc;
          }
          a:hover {
            text-decoration: underline;
          }
          .section {
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="section">
          <h1>Get All Routes</h1>
          <ul>
            <li>Get All products:- <a href="/api/products/">/products</a></li>
            <li>Get All categories:- <a href="/api/category/getAll">/category/getAll</a></li>
            <li>Get All companies:- <a href="/api/company/getAll">/company/getAll</a></li>
            <li>Get All products by Id: -<a href="/api/products/1">/products/1</a></li>
          </ul>
        </div>

        <div class="section">
          <h1>Combination Routes</h1>
          <ul>
            <li>products from a company(AMZ):- <a href="/api/company/AMZ/products">/company/AMZ/products</a></li>
            <li>products from a category(Laptop):- <a href="/api/category/Laptop/products">/category/Laptop/products</a></li>
            <li>products from a company(AMZ) and category(Laptop):- <a href="/api/company/AMZ/category/Laptop/products">/company/AMZ/category/Laptop/products</a></li>
          </ul>
        </div>

        <div class="section">
          <h1>Filters from Query</h1>
          <p><strong>These filters are available for all the above combination routes:</strong></p>
          <ul>
            <li>availability</li>
            <li>minPrice</li>
            <li>maxPrice</li>
            <li>minRating</li>
            <li>maxRating</li>
            <li>page</li>
            <li>limit</li>
            <li>sortOn
              <ol>
                <li>name</li>
                <li>price</li>
                <li>rating</li>
                <li>discount</li>
              </ol>
            </li>
          </ul>
        </div>

        <div class="section">
          <h4>Examples:</h4>
          <ul>
            <li><a href="/api/category/Laptop/products?page=2">/category/Laptop/products?page=2</a></li>
            <li><a href="/api/company/FLP/products?sortOn=price-asc">/company/FLP/products?sortOn=price-asc</a></li>
            <li>
              <a href="/api/category/Laptop/products?availability=yes&sortOn=discount-asc&minPrice=2000&maxPrice=5000&minRating=3&maxRating=4.5">
                /category/Laptop/products?availability=yes&sortOn=discount-asc&minPrice=2000&maxPrice=5000&minRating=3&maxRating=4.5
              </a>
            </li>
          </ul>
        </div>

        <div class="section">
          <h4>Product Object Structure looks like: </h4>
          <pre>
  {
    "_id": 146,
    "availability": "yes",
    "category": "Laptop",
    "company": "AMZ",
    "discount": 10,
    "price": 3000,
    "productName": "Laptop 16",
    "rating": 4.2,
    "__v": 0
  }
          </pre>
        </div>
      </body>
    </html>
  `;

  res.send(html);
});

router.get("/company/getAll", async (req, res) => {
  try {
    const data = await Company.find({});
    res.json({
      totalItems: req.queryData.totalItems,
      totalPages: req.queryData.totalPages,
      currentPage: req.queryData.currentPage,
      companies: data
    });
  } catch (err) {
    console.error("Error fetching data from database:", err);
    res.status(500).send("Error fetching data from database");
  }
});

router.get("/category/getAll", async (req, res) => {
  try {
    const data = await Category.find({});
    res.json({
      totalItems: req.queryData.totalItems,
      totalPages: req.queryData.totalPages,
      currentPage: req.queryData.currentPage,
      categories: data
    });
  } catch (err) {
    console.error("Error fetching data from database:", err);
    res.status(500).send("Error fetching data from database");
  }
});

router.get('/category/:category/products', async (req, res) => {
  try {
    const length = await Products.countDocuments({ category: req.params.category, ...req.queryData.DB_filters });
    const products = await Products.find({ category: req.params.category, ...req.queryData.DB_filters })
      .sort(req.queryData.sortCriteria)
      .skip(req.queryData.skip)
      .limit(req.queryData.limit);

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found in this category" });
    }
    res.json({
      totalItems: length,
      totalPages: Math.ceil(length / req.queryData.limit),
      currentPage: req.queryData.currentPage,
      products: products
    });
  } catch (err) {
    console.error("Error finding products by category:", err);
    res.status(500).send("Error finding products");
  }
});

router.get('/company/:company/products', async (req, res) => {
  try {
    const length = await Products.countDocuments({ company: req.params.company, ...req.queryData.DB_filters });
    const products = await Products.find({ company: req.params.company, ...req.queryData.DB_filters })
      .sort(req.queryData.sortCriteria)
      .skip(req.queryData.skip)
      .limit(req.queryData.limit);

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found for this company" });
    }
    res.json({
      totalItems: length,
      totalPages: Math.ceil(length / req.queryData.limit),
      currentPage: req.queryData.currentPage,
      products: products
    });
  } catch (err) {
    console.error("Error finding products by company:", err);
    res.status(500).send("Error finding products");
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const product = await Products.findOne({ _id: req.params.id, ...req.queryData.DB_filters });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({
      totalItems: 1,
      totalPages: 1,
      currentPage: req.queryData.currentPage,
      product: product
    });
  } catch (err) {
    console.error("Error finding product by ID:", err);
    res.status(500).send("Error finding product");
  }
});

router.get('/products', async (req, res) => {
  try {
    const length = await Products.countDocuments(req.queryData.DB_filters);
    const products = await Products.find(req.queryData.DB_filters)
      .sort(req.queryData.sortCriteria)
      .skip(req.queryData.skip)
      .limit(req.queryData.limit);

    res.json({
      totalItems: length,
      totalPages: Math.ceil(length / req.queryData.limit),
      currentPage: req.queryData.currentPage,
      products: products
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("Error fetching products");
  }
});

router.get('/company/:company/category/:category/products', async (req, res) => {
  try {
    const length = await Products.countDocuments({ company: req.params.company, category: req.params.category, ...req.queryData.DB_filters });
    const products = await Products.find({ company: req.params.company, category: req.params.category, ...req.queryData.DB_filters })
      .sort(req.queryData.sortCriteria)
      .skip(req.queryData.skip)
      .limit(req.queryData.limit);

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found for this company in this category" });
    }
    res.json({
      totalItems: length,
      totalPages: Math.ceil(length / req.queryData.limit),
      currentPage: req.queryData.currentPage,
      products: products
    });
  } catch (err) {
    console.error("Error finding products by company and category:", err);
    res.status(500).send("Error finding products");
  }
});

module.exports = router;
