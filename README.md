# E-Commerce REST API

A fully-functional e-commerce REST API built with Express.js, Node.js, and PostgreSQL. This project implements core e-commerce functionality including user authentication, product management, shopping cart operations, and order processing.

## 🚀 Features

- **User Management**
  - User registration and authentication
  - Secure login/logout functionality
  - User profile CRUD operations

- **Product Management**
  - Browse and search products
  - Full CRUD operations for product catalog
  - Product categorization and filtering

- **Shopping Cart**
  - Add/remove items from cart
  - Update item quantities
  - Persistent cart storage

- **Order Processing**
  - Place orders from cart items
  - Order history and tracking
  - Order status management

- **API Documentation**
  - Comprehensive Swagger documentation
  - Interactive API explorer

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Documentation**: Swagger/OpenAPI
- **Version Control**: Git & GitHub

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [PostgreSQL](https://www.postgresql.org/)
- [Git](https://git-scm.com/)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/CodeWizardX1/ecommerce-rest-api.git
   cd ecommerce-rest-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   PORT=3000
   DATABASE_URL=postgresql://username:password@localhost:5432/ecommerce_db
   JWT_SECRET=your_jwt_secret_here
   ```

4. **Set up the database**
   ```bash
   # Create the database
   createdb ecommerce_db
   
   # Run migrations (once implemented)
   npm run migrate
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

   The API will be available at `http://localhost:3000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/profile` - Delete user account

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item quantity
- `DELETE /api/cart/items/:id` - Remove item from cart

### Orders
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order status (admin)

## 📖 API Documentation

Once the server is running, you can access the interactive API documentation at:
```
http://localhost:3000/api-docs
```

## 🗄️ Database Schema

The application uses the following main entities:

- **Users**: Store user account information
- **Products**: Product catalog with details and pricing
- **Categories**: Product categorization
- **Cart**: User shopping cart items
- **Orders**: Order information and history
- **Order_Items**: Individual items within orders

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Using Heroku

1. Create a Heroku app
2. Add PostgreSQL addon
3. Set environment variables
4. Deploy the application

```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Development Roadmap

- [ ] Implement user authentication with JWT
- [ ] Set up PostgreSQL database connection
- [ ] Create database migrations and seeds
- [ ] Implement product CRUD operations
- [ ] Implement cart functionality
- [ ] Implement order processing
- [ ] Add input validation and error handling
- [ ] Implement API rate limiting
- [ ] Add comprehensive test suite
- [ ] Set up Swagger documentation
- [ ] Add payment processing integration
- [ ] Implement email notifications
- [ ] Add admin dashboard endpoints

## 📄 License

This project is licensed under the ISC License.

## 📞 Contact

**CodeWizardX1** - [GitHub Profile](https://github.com/CodeWizardX1)

Project Link: [https://github.com/CodeWizardX1/ecommerce-rest-api](https://github.com/CodeWizardX1/ecommerce-rest-api)

---

*This project was created as part of the Codecademy Full-Stack Engineer curriculum.*
