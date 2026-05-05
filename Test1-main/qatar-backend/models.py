from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(200))

class Opportunity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    duration = db.Column(db.String(50))
    start_date = db.Column(db.String(50))
    description = db.Column(db.Text)
    skills = db.Column(db.Text)
    category = db.Column(db.String(50))
    future = db.Column(db.Text)
    max_applicants = db.Column(db.Integer)
    admin_id = db.Column(db.Integer, db.ForeignKey('admin.id'))