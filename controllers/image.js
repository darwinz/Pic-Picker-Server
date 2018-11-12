const userModule = require("../modules/user");
const imageModule = require("../modules/image");
const viewModule = require("../modules/view");
const { testImages, testUsers } = require("../testObjects");

exports.imageUpload = async (req, res, next) => {
  console.log(req.body);
  const { userId, uri } = req.body;
  try {
    await imageModule.imageUpload(userId, uri);
    const result = await imageModule.userImages(userId);
    res.status(201).send(result[0]);
  } catch (error) {
    console.log(error);
    res.status(400).send();
  }
};

exports.userImages = async (req, res, next) => {
  const userId = req.headers.userid;
  try {
    const queryresult = await imageModule.userImages(userId);
    const result = await Promise.all(queryresult.map(image => _updateDataImage(image)));

    res.status(200).send(result);
  } catch (error) {
    console.log(error);
    res.status(400).send();
  }
};

// Use the views to generate the data object and update this in the database
_updateDataImage = async image => {
  // check current state of images
  let data = image.data;
  let { score, people, feedbackAge, feedbackGender } = data;

  // check the views
  const views = image.views;
  const count = image.views.length;

  // if any views were added since last time continue and add to the data
  if (count > people) {
    console.log("doing")
    for (let index = 0; people < count; index++) {
      let view = views[index];
      const { userGender, userAge, isUpVote } = view;
      people++;
      isUpVote ? score = score + 1 : score = - 1;
      if (userGender === "both" || userGender === "male") {
        feedbackGender.male.upVotes = feedbackGender.male.upVotes + isUpVote;
        feedbackGender.male.people = feedbackGender.male.people + 1;
      }
      if (userGender === "both" || userGender === "female") {
        feedbackGender.female.upVotes = feedbackGender.female.upVotes + isUpVote;
        feedbackGender.female.people = feedbackGender.female.people + 1;
      }
      if (userAge >= 18 && userAge < 25) {
        feedbackAge[0].upVotes = feedbackAge[0].upVotes + isUpVote;
        feedbackAge[0].people = feedbackAge[0].people + 1;
      } else if (userAge >= 25 && userAge < 35) {
        feedbackAge[1].upVotes = feedbackAge[1].upVotes + isUpVote;
        feedbackAge[1].people = feedbackAge[1].people + 1;
      } else if (userAge >= 35 && userAge < 45) {
        feedbackAge[2].upVotes = feedbackAge[2].upVotes + isUpVote;
        feedbackAge[2].people = feedbackAge[2].people + 1;
      } else if (userAge >= 45) {
        feedbackAge[3].upVotes = feedbackAge[3].upVotes + isUpVote;
        feedbackAge[3].people = feedbackAge[3].people + 1;
      }
    } // For
    const newData = {
      score: score,
      people: people,
      feedbackGender: feedbackGender,
      feedbackAge: feedbackAge
    }
    await imageModule.imageUpdate({data: newData},image.id);
    return await imageModule.findImage(image.id);
  } else {
    return image;
  }
};
