const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title && author && email && file) { // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];

      const titlePattern = /<\/?.*>/;
      const emailPattern = /^[a-zA-Z]+(\.)?[\w]*([A-Za-z0-9])+@([a-zA-Z]+(\.){1}){1,3}[A-Za-z]{2,4}$/;

      if(fileExt != 'jpg' && fileExt != 'png' && fileExt != 'gif' ||
      title.length > 25 || author.length > 50 || titlePattern.test(title) || emailPattern.test(email) ) throw (err);

      const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
      await newPhoto.save(); // ...save new photo in DB
      res.json(newPhoto);

    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const ip = requestIp.getClientIp(req); 
    const photoToUpdate = await Photo.findOne({_id: req.params.id});
    const voter = await Voter.findOne({user: ip})
    
    if (!photoToUpdate) res.status(404).json({message: 'Not found'});
    else {
      if (voter) {
        if (voter.votes.includes(photoToUpdate._id)) {
          res.status(500).json({message: 'you can\'t vote again for the same photo'})
        } else {
          console.log('photo  to update ' + photoToUpdate._id);
          voter.votes.push(photoToUpdate._id);
          console.log('photo  to update votes ' + photoToUpdate.votes);
          console.log('voter votes ' + voter.votes);
          photoToUpdate.votes++;
          photoToUpdate.save();
          res.send({message: 'OK'});
          console.log('voter votKONIECCes ' + voter.votes);

        }
      } else {
        const newVoter = new Voter({
          user: ip,
          votes: [ photoToUpdate._id ]
        });
        await newVoter.save();
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({message: 'OK'});
      }
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
