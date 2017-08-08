#!/usr/bin/env python3
"""
Mietspiegel API

"""
import os
import logging

from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from logger import setup_logger
from parser import MietspiegelParser
from pprint import pformat

logger = setup_logger(logfile="./main.log", level=logging.INFO)

db = SQLAlchemy()


def create_app(config=None):
    app = Flask(__name__)

    # See http://flask.pocoo.org/docs/0.12/config/
    app.config.update(dict(DEBUG=True, SECRET_KEY="development key"))
    app.config.update(config or {})
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = 'sqlite:///../Mietspiegel.db'
    app.config["SQLALCHEMY_ECHO"] = False
    app.config["SQLALCHEMY_RECORD_QUERIES"] = False

    db.init_app(app)

    CORS(app)

    @app.route("/api/v1/street", methods=["GET"])
    def find_street():
        """Search for streets in the db, fall back to crawling."""
        from model import Street
        rv = {}

        logger.info("Street API\nData: {}".format(pformat(request.args)))

        street_name = request.args.get("name")
        if street_name is None or len(street_name) < 4:
            rv["errors"] = ["Street query too short"]
        else:
            # get results
            street_data = Street.find(street_name)

            if len(street_data) > 0:
                rv["data"] = street_data
            else:
                # Fallback to querying the actual Mietspiegel site
                ps = MietspiegelParser()
                rv["data"] = ps.find_street(street_name)

        return jsonify(rv)

    @app.route("/api/v1/range", methods=["POST"])
    def get_range():
        from model import Street
        rv = {}
        data = request.get_json()

        street_id = int(data.get("street_id"))
        year_range = data.get("year_range")
        real_size = data.get("real_size")

        if real_size is None:
            guessed_size = data.get("guessed_size")
        else:
            guessed_size = None

        logger.info("Range API\nData: {}".format(pformat(data)))

        range_data = Street.get_range(street_id, year_range, real_size, guessed_size)
        if range_data is not None:
            rv["data"] = range_data
        else:
            ps = MietspiegelParser()
            rv["data"] = ps.get_range(street_id, year_range, real_size, guessed_size)
        return jsonify(rv)
    return app


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app = create_app()
    app.run(host="0.0.0.0", port=port)
