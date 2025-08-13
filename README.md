# E-Commerce REST API

A fully-functional e-commerce REST API built with Express.js, Node.js, and PostgreSQL. This project implements core e-commerce functionality including user authentication, product management, shopping cart operations, order processing, and a complete checkout system.

## 🚀 Features

- **User Management**
  - User registration and authentication with JWT tokens
  - Secure password hashing with bcrypt
  - User profile management with address storage
  - Protected routes with Bearer token authentication

- **Product Management**
  - Browse and search products with pagination
  - Product categorization and filtering
  - Product image management
  - Inventory tracking and stock management
  - Full CRUD operations for products and categories

- **Shopping Cart**
  - Add/remove items from cart
  - Update item quantities with real-time validation
  - Persistent cart storage per user
  - Automatic cart creation on user registration

- **Order Processing**
  - Complete checkout system with payment processing
  - Order creation from cart items
  - Inventory deduction and stock validation
  - Order history and tracking
  - Payment records and status tracking

- **Address Management**
  - Multiple addresses per user
  - Billing and shipping address support
  - Default address configuration

- **API Documentation**
  - Comprehensive Swagger/OpenAPI 3.0 documentation
  - Interactive API explorer with authentication
  - Complete schema definitions and examples

## 🛠️ Tech Stack

- **Backend**: Node.js (ES Modules), Express.js 5.1.0
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JSON Web Tokens (JWT) with bcryptjs
- **Documentation**: Swagger UI Express with YAML configuration
- **Validation**: Express Validator
- **Environment**: dotenv for configuration management

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher, ES Modules support required)
- [PostgreSQL](https://www.postgresql.org/) (v12 or higher)
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
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=3000
   
   # Database Configuration
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   ```

4. **Set up the PostgreSQL database**
   ```bash
   # Create the database
   createdb ecommerce
   
   # Or using psql
   psql -U postgres -c "CREATE DATABASE ecommerce;"
   ```

5. **Create database tables**
   You'll need to create the following tables in your PostgreSQL database:
   
   ```sql
   -- Users table
   CREATE TABLE users (
     id SERIAL PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     password_hash VARCHAR(255) NOT NULL,
     full_name VARCHAR(255),
     phone VARCHAR(50),
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   
   -- Categories table
   CREATE TABLE categories (
     id SERIAL PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     slug VARCHAR(255) UNIQUE NOT NULL,
     parent_id INTEGER REFERENCES categories(id)
   );
   
   -- Products table
   CREATE TABLE products (
     id SERIAL PRIMARY KEY,
     title VARCHAR(255) NOT NULL,
     description TEXT,
     price_cents INTEGER NOT NULL,
     category_id INTEGER REFERENCES categories(id),
     sku VARCHAR(100) UNIQUE,
     is_active BOOLEAN DEFAULT TRUE,
     created_at TIMESTAMP DEFAULT NOW()
   );
   
   -- Inventory table
   CREATE TABLE inventory (
     product_id INTEGER PRIMARY KEY REFERENCES products(id),
     quantity INTEGER NOT NULL DEFAULT 0
   );
   
   -- Addresses table
   CREATE TABLE addresses (
     id SERIAL PRIMARY KEY,
     user_id INTEGER NOT NULL REFERENCES users(id),
     label VARCHAR(100),
     line1 VARCHAR(255) NOT NULL,
     line2 VARCHAR(255),
     city VARCHAR(100) NOT NULL,
     region VARCHAR(100),
     postal_code VARCHAR(20) NOT NULL,
     country_code VARCHAR(2) NOT NULL,
     is_default_billing BOOLEAN DEFAULT FALSE,
     is_default_shipping BOOLEAN DEFAULT FALSE
   );
   
   -- Carts table
   CREATE TABLE carts (
     id SERIAL PRIMARY KEY,
     user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   
   -- Cart items table
   CREATE TABLE cart_items (
     id SERIAL PRIMARY KEY,
     cart_id INTEGER NOT NULL REFERENCES carts(id),
     product_id INTEGER NOT NULL REFERENCES products(id),
     quantity INTEGER NOT NULL CHECK (quantity > 0),
     unit_price_cents INTEGER NOT NULL,
     UNIQUE(cart_id, product_id)
   );
   
   -- Orders table
   CREATE TABLE orders (
     id SERIAL PRIMARY KEY,
     user_id INTEGER NOT NULL REFERENCES users(id),
     status VARCHAR(50) NOT NULL DEFAULT 'pending',
     subtotal_cents INTEGER NOT NULL,
     shipping_cents INTEGER NOT NULL DEFAULT 0,
     tax_cents INTEGER NOT NULL DEFAULT 0,
     total_cents INTEGER NOT NULL,
     billing_address_id INTEGER REFERENCES addresses(id),
     shipping_address_id INTEGER REFERENCES addresses(id),
     placed_at TIMESTAMP DEFAULT NOW()
   );
   
   -- Order items table
   CREATE TABLE order_items (
     id SERIAL PRIMARY KEY,
     order_id INTEGER NOT NULL REFERENCES orders(id),
     product_id INTEGER REFERENCES products(id),
     title_snapshot VARCHAR(255) NOT NULL,
     unit_price_cents INTEGER NOT NULL,
     quantity INTEGER NOT NULL
   );
   
   -- Payments table
   CREATE TABLE payments (
     id SERIAL PRIMARY KEY,
     order_id INTEGER NOT NULL REFERENCES orders(id),
     provider VARCHAR(100) NOT NULL,
     provider_ref VARCHAR(255),
     amount_cents INTEGER NOT NULL,
     status VARCHAR(50) NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

6. **Start the development server**
   ```bash
   npm start
   ```

   The API will be available at `http://localhost:3000`

## 📚 API Endpoints

### Base URL: `http://localhost:3000/api/v1`

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - User login (returns JWT token)

### Users & Addresses
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update user profile
- `GET /users/me/addresses` - Get user addresses
- `POST /users/me/addresses` - Create new address
- `PUT /users/me/addresses/:id` - Update address
- `DELETE /users/me/addresses/:id` - Delete address

### Categories
- `GET /categories` - Get all categories
- `POST /categories` - Create category (admin)
- `PUT /categories/:id` - Update category (admin)
- `DELETE /categories/:id` - Delete category (admin)

### Products
- `GET /products` - Get products (with search, category filter, pagination)
- `GET /products/:id` - Get product by ID
- `POST /products` - Create product (admin)
- `PUT /products/:id` - Update product (admin)
- `DELETE /products/:id` - Archive product (admin)
- `GET /products/:id/images` - Get product images
- `POST /products/:id/images` - Add product image (admin)
- `DELETE /product-images/:imageId` - Delete product image (admin)

### Shopping Cart
- `GET /cart` - Get user's cart
- `POST /cart/items` - Add/update item in cart (upsert)
- `PUT /cart/items/:id` - Update cart item quantity
- `DELETE /cart/items/:id` - Remove item from cart
- `DELETE /cart` - Clear entire cart

### Orders & Payments
- `GET /orders` - Get user's order history
- `GET /orders/:id` - Get specific order details
- `POST /orders` - Create order from cart
- `POST /orders/:id/payments` - Create payment for order
- `GET /orders/:id/payments` - Get order payments

### Checkout
- `POST /checkout` - Complete checkout (create order, process payment, clear cart)

### Health & Documentation
- `GET /health` - API health check
- `GET /docs` - Swagger UI documentation
- `GET /docs.json` - OpenAPI JSON specification

## 🔐 Authentication

This API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

1. Register a new user:
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123", "fullName": "John Doe"}'
```

2. Login to get a token:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

## 📖 API Documentation

Once the server is running, you can access the interactive API documentation at:
```
http://localhost:3000/docs
```

The documentation includes:
- Complete endpoint descriptions
- Request/response schemas
- Interactive testing interface
- Authentication examples

## 🗄️ Database Schema

The application uses a PostgreSQL database with the following entities:

- **users**: User accounts and profiles
- **categories**: Product categorization hierarchy
- **products**: Product catalog with pricing and details
- **inventory**: Stock levels for products
- **addresses**: User billing and shipping addresses
- **carts**: User shopping carts (one per user)
- **cart_items**: Items within shopping carts
- **orders**: Order information and status
- **order_items**: Individual items within orders
- **payments**: Payment records and status

## 🚀 Usage Examples

### Complete Shopping Flow

1. **Register and Login**
```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@example.com", "password": "securepass123", "fullName": "Jane Customer"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@example.com", "password": "securepass123"}'
```

2. **Browse Products**
```bash
# Get products with search and pagination
curl "http://localhost:3000/api/v1/products?search=laptop&limit=10&offset=0"
```

3. **Add to Cart**
```bash
# Add item to cart (requires authentication)
curl -X POST http://localhost:3000/api/v1/cart/items \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"productId": 1, "quantity": 2}'
```

4. **Checkout**
```bash
# Complete checkout
curl -X POST http://localhost:3000/api/v1/checkout \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"provider": "test"}'
```

## 🧪 Testing

Currently, the project uses a basic test setup. To run tests:

```bash
npm test
```

**Note**: Test implementation is planned for future development.

## �️ Development

### Scripts Available

- `npm start` - Start the production server
- `npm test` - Run tests (not yet implemented)

### Adding New Features

1. Create feature branch
2. Add route handlers in `src/routes/`
3. Update OpenAPI documentation in `openapi.yaml`
4. Test endpoints with Swagger UI
5. Submit pull request

## 🚀 Deployment

### Environment Variables for Production

```env
PORT=3000
DATABASE_URL=postgresql://user:pass@host:port/database
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

### Using Heroku

1. Create Heroku app and add PostgreSQL addon:
```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
```

2. Set environment variables:
```bash
heroku config:set JWT_SECRET=your-production-secret
heroku config:set JWT_EXPIRES_IN=7d
```

3. Deploy:
```bash
git push heroku main
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Use ES Modules syntax
- Follow Express.js best practices
- Include proper error handling
- Update OpenAPI documentation for new endpoints
- Use meaningful commit messages

## ✅ Project Status

**Completed Features:**
- ✅ User authentication with JWT
- ✅ PostgreSQL database integration
- ✅ Product CRUD operations
- ✅ Shopping cart functionality
- ✅ Complete order processing
- ✅ Checkout system with payment simulation
- ✅ Address management
- ✅ Comprehensive API documentation
- ✅ Input validation and error handling
- ✅ ES Modules implementation

**Future Enhancements:**
- [ ] Comprehensive test suite
- [ ] Real payment gateway integration (Stripe)
- [ ] Email notifications
- [ ] Admin dashboard
- [ ] Rate limiting
- [ ] File upload for product images
- [ ] Advanced search and filtering
- [ ] Order tracking system

## 📄 License

This project is licensed under the ISC License.

## 📞 Contact

**CodeWizardX1** - [GitHub Profile](https://github.com/CodeWizardX1)

Project Link: [https://github.com/CodeWizardX1/ecommerce-rest-api](https://github.com/CodeWizardX1/ecommerce-rest-api)

---

*This project was created as part of the Codecademy Full-Stack Engineer curriculum.*
