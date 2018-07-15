const mongoose = require('mongoose');

const { Schema } = mongoose;

const artistSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, trim: true },
  biography: { type: String, trim: true },
  links: [
    {
      _id: false,
      title: { type: String, trim: true },
      uri: { type: String, trim: true }
    }
  ],
  releases: [{ type: Schema.Types.ObjectId, ref: 'Release' }]
});

mongoose.model('artists', artistSchema);
