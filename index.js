import 'dotenv/config';
import app from './app.js';
import sequelize from './src/config/database.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida correctamente.');
    
    await sequelize.sync();
    console.log('✅ Modelos sincronizados con la base de datos.');

    app.listen(3005);


    /*app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });*/

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
  }
}

startServer();
