import mongoose from "mongoose";

const connectDatabase = async () => {

  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URL}/${process.env.DB_NAME}`
    );
    console.log(
      `\n MONGODB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export default connectDatabase;
