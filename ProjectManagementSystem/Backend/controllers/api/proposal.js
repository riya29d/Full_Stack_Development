var express = require("express");
var mongoose = require("mongoose");

var ProposalModel = require("../../models/proposal");
var UserModel = require("../../models/user");
var ErrorHelper = require("../../helpers/error");
const { resource } = require("../../app");

// TODO: Add file conversion to bit-string
// TODO: Add validation for all basic cases such as length, existence, sanity, etc.
// TODO: Add validation for semantic integrity:
//      - supervisors MUST be faculty
//      - members must NOT contain the leader - if so, remove it
//      - (add on...)
function create(req, res, next) {
  function getUsersFromEmails(emailArr) {
    return UserModel.onlyExisting().getByEmails(emailArr);
  }

  // change the document format to Buffer from Base64

  //   try {
  //     var document_b64 = req.body.pdf_document;
  //     req.body.pdf_document = Buffer.from(document_b64, "base64");
  //   } catch (error) {
  //     // terminal return
  //     return void res
  //       .status(400)
  //       .send(ErrorHelper.construct_json_response(error));
  //   }
  // decode emails into user objects - supervisor, leader, members
  // syntactic convenience in leader array - only ONE leader

  Promise.all([
    getUsersFromEmails(req.body.supervisors),
    getUsersFromEmails(req.body.members),
    getUsersFromEmails([req.body.leader]),
  ])
    .then(([supervisors, members, [leader]]) => {
      if (supervisors.length != req.body.supervisors.length) {
        res.status(400).send({
          message: "One or more invalid emails for supervisors",
        });
      } else if (members.length != req.body.members.length) {
        res.status(400).send({
          message: "One or more invalid emails for members",
        });
      } else if (leader == null) {
        res.status(400).send({
          message: "Invalid leader email",
        });
      } else {
        req.body.supervisors = supervisors;
        req.body.members = members;
        req.body.leader = leader;
        delete req.body.pdf_document;
        const proposal = new ProposalModel(req.body);
        proposal
          .save()
          .then((resource) => {
            // resource.pdf_document = resource.document_b64;
            res.status(201).send({
              id: resource._id,
              url: resource.url,
              message: "Proposal created",
            });
          })
          .catch((error) => {
            res.status(400).send(ErrorHelper.construct_json_response(error));
          });
      }
    })
    .catch((error) => {
      res.status(400).send(ErrorHelper.construct_json_response(error));
    });

  /*
    function getUsersFromEmails(emailArr) {
        destnArr = [];
        emailArr.forEach(
            function (email, idx) {
                destnArr.push(
                    UserModel
                        .onlyExisting()
                        .getByEmail(email)
                );
            }
        );
        return Promise.all(destnArr);
    }
    */

  // req.body.members.forEach(
  //     get_converter_callbk(member_ids)
  // );
  // [req.body.leader].forEach(
  //     get_converter_callbk(leader_ids)
  // );
  // console.log(supervisor_ids);
  // console.log(leader_ids);
  // console.log(member_ids);

  //console.trace();
  // return void res.status(402).send({ id: "test" });
  /*
    const proposal = new ProposalModel(req.body);
    proposal
        .save()
        .then((resource => {
            res.status(201).send({
                id: resource._id,
                message: "Proposal created"
            })
        }))
        .catch((error) => {
            res.status(400).send(
                ErrorHelper.construct_json_response(error)
            );
        });
    */
}

function getAll(req, res, next) {
  ProposalModel.onlyExisting()
    .then((resources) => {
      //   resources.forEach(function (rsrc, idx) {
      //     let go;
      //     // rsrc.pdf_document = rsrc.document_base64;
      //   });
      //   console.log(resources);

      resources = resources.map((obj) => {
        let temp = obj.toJSON();
        delete temp["pdf_document"];
        return temp;
      }); // README
      console.log(Object.keys(resources[0]));

      resources.map((obj) => {
        delete obj.pdf_document;
      });

      res.status(200).send(resources);
    })
    .catch((error) => {
      res.status(400).send(ErrorHelper.construct_json_response(error));
    });
}

function getByUser(user_id, req, res, next) {
  function getProposalsForRole(role_field, user_id) {
    return ProposalModel.onlyExisting().find({
      [role_field]: user_id,
    });
  }

  if (mongoose.Types.ObjectId.isValid(user_id)) {
    user_id = mongoose.Types.ObjectId(user_id);
    Promise.all([
      getProposalsForRole("supervisors", user_id),
      getProposalsForRole("members", user_id),
      getProposalsForRole("leader", user_id),
    ])
      .then(([supervisor_proposals, member_proposals, leader_proposals]) => {
        res.status(200).send({
          as_supervisor: supervisor_proposals,
          as_member: member_proposals,
          as_leader: leader_proposals,
        });
      })
      .catch((error) => {
        res.status(400).send(ErrorHelper.construct_json_response(error));
      });
  } else {
    res.status(404).send({
      message: "Proposal not found",
    });
  }
}

function getById(id, req, res, next) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    ProposalModel.onlyExisting()
      .getById(id)
      .populate("leader")
      .populate("members")
      .populate("supervisors")
      .then((resource) => {
        if (resource.length == 0) {
          throw {
            error: "Proposal not found",
            message: "Could not find a proposal for that ID",
            code: 801,
          };
        }
        resource = resource[0];
        resource.pdf_document = resource.document_base64;
        res.status(200).send(resource);
      })
      .catch((error) => {
        res.status(400).send(ErrorHelper.construct_json_response(error));
      });
  } else {
    res.status(404).send(
      ErrorHelper.construct_json_response({
        error: "Proposal not found",
        message: "Could not find a proposal for that ID",
        code: 801,
      })
    );
  }
}

function rejectProposal(req, res, next) {
  // check if proposal is pending status
  if (mongoose.Types.ObjectId.isValid(req.body.id)) {
    proposal_id = mongoose.Types.ObjectId(req.body.id);
    new Promise((resolve, reject) => {
      ProposalModel.onlyExisting()
        .getById(proposal_id)
        .then(([proposal]) => {
          if (!proposal.isAwaitingDecision()) {
            reject({
              name: "Proposal not awaiting decision",
              message:
                "Proposal not awating decision. It has already been approved or rejected",
              code: 951,
            });
          } else {
            // update status of the proposal
            ProposalModel.updateOne(
              {
                _id: proposal_id,
              },
              {
                rejected_on: Date.now(),
                rejection_remarks: req.body.remarks,
              }
            ).then((result) => {
              resolve(result);
            });
          }
        });
    })
      .then((updation_data) => {
        if (!updation_data.acknowledged) {
          throw {
            error: "Proposal could not be updated",
            message: "Error occurred when updating proposal status. Try later",
            code: 952,
          };
        }
        res.status(201).send({
          proposal_id: proposal_id,
          message: "Proposal marked as rejected",
        });
      })
      .catch((error) => {
        console.log(error);
        res.status(400).send(ErrorHelper.construct_json_response(error));
      });
  } else {
    res.status(404).send({
      message: "Proposal not found",
    });
  }
}

exports.create = create;
exports.getAll = getAll;
exports.getById = getById;
exports.getByUser = getByUser;
exports.rejectProposal = rejectProposal;
