package service

import (
	"errors"
	"fmt"
	"time"

	"traffic-police/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Store struct {
	DB *gorm.DB
}

func NewStore(db *gorm.DB) *Store {
	return &Store{DB: db}
}

//
// ===== Police =====
//

func (s *Store) CreatePolice(p *models.User) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(p.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	p.Password = string(hash)
	p.Role = models.UserRoleTraffic
	return s.DB.Create(p).Error
}

func (s *Store) ListPolice(out *[]models.User) error {
	return s.DB.Where("role = ?", models.UserRoleTraffic).Order("created_at desc").Find(out).Error
}

func (s *Store) GetPolice(id string, out *models.User) error {
	return s.DB.Where("id = ? AND role = ?", id, models.UserRoleTraffic).First(out).Error
}

func (s *Store) TogglePoliceSuspend(id string, out *models.User) error {
	if err := s.GetPolice(id, out); err != nil {
		return err
	}
	out.PoliceProfile.IsSuspended = !out.PoliceProfile.IsSuspended
	return s.DB.Save(out).Error
}

var rankOrder = []models.Rank{models.RankLow, models.RankMedium, models.RankHigh}

func (s *Store) ChangePoliceRank(id string, out *models.User, upgrade bool) error {
	if err := s.GetPolice(id, out); err != nil {
		return err
	}
	idx := -1
	for i, r := range rankOrder {
		if r == out.PoliceProfile.Rank {
			idx = i
			break
		}
	}
	if upgrade {
		if idx >= len(rankOrder)-1 {
			return fmt.Errorf("already max rank")
		}
		out.PoliceProfile.Rank = rankOrder[idx+1]
	} else {
		if idx <= 0 {
			return fmt.Errorf("already min rank")
		}
		out.PoliceProfile.Rank = rankOrder[idx-1]
	}
	return s.DB.Save(out).Error
}

//
// ===== Owners =====
//

func (s *Store) CreateOwner(o *models.Owner) error {
	return s.DB.Create(o).Error
}

func (s *Store) ListOwners(out *[]models.Owner) error {
	return s.DB.Order("created_at desc").Find(out).Error
}

func (s *Store) GetOwner(id string, out *models.Owner) error {
	return s.DB.First(out, "id = ?", id).Error
}

//
// ===== Vehicles =====
//

func (s *Store) CreateVehicle(v *models.Vehicle) error {
	// ensure owner exists
	if v.OwnerID != "" {
		var o models.Owner
		if err := s.GetOwner(v.OwnerID, &o); err != nil {
			return err
		}
	}
	return s.DB.Create(v).Error
}

func (s *Store) ListVehicles(out *[]models.Vehicle) error {
	return s.DB.Preload("Owner").Order("created_at desc").Find(out).Error
}

// func (s *Store) GetVehicle(id string, out *models.Vehicle) error {
// 	return s.DB.Preload("Owner").First(out, "registration = ?", id).Error
// }

func (s *Store) SearchVehicles(req models.SearchVehicleRequest, out *[]models.Vehicle) error {
	q := s.DB.Model(&models.Vehicle{}).Preload("Owner")

	if req.Mark != "" {
		q = q.Where("mark ILIKE ?", "%"+req.Mark+"%")
	}
	if req.Model != "" {
		q = q.Where(`"model" ILIKE ?`, "%"+req.Model+"%")
	}
	if req.Color != "" {
		q = q.Where("color ILIKE ?", "%"+req.Color+"%")
	}
	if req.Registration != "" {
		q = q.Where("registration ILIKE ?", "%"+req.Registration+"%")
	}

	return q.Order("created_at desc").Find(out).Error
}

func (s *Store) VerifyVehicle(req models.VehicleVerificationRequest) (bool, *models.Vehicle, error) {
	if req.Registration == "" || req.JMBG == "" {
		return false, nil, errors.New("registration and jmbg are required")
	}

	var v models.Vehicle
	err := s.DB.Preload("Owner").
		First(&v, "registration = ?", req.Registration).Error
	if err != nil {
		return false, nil, err
	}

	if v.Owner.JMBG != req.JMBG {
		return false, &v, nil
	}
	if v.IsStolen {
		return false, &v, nil
	}
	return true, &v, nil
}

//
// ===== Violations =====
//

func (s *Store) CreateViolation(v *models.Violation) error {
	if v.PoliceID != "" {
		var p models.User // ← User umesto PoliceProfile
		if err := s.GetPolice(v.PoliceID, &p); err != nil {
			return err
		}
		if p.PoliceProfile.IsSuspended { // ← kroz PoliceProfile
			return errors.New("police person is suspended")
		}
	}

	if v.Date.IsZero() {
		v.Date = time.Now()
	}

	return s.DB.Create(v).Error
}

func (s *Store) ListViolations(out *[]models.Violation) error {
	return s.DB.Order("date desc").Find(out).Error
}

func (s *Store) GetViolation(id string, out *models.Violation) error {
	return s.DB.First(out, "id = ?", id).Error
}

func (s *Store) ListViolationsByDriver(driverId string, out *[]models.Violation) error {
	return s.DB.Where("driver_id = ?", driverId).Order("date desc").Find(out).Error
}

//
// ===== Ownership transfers =====
//

func (s *Store) CreateTransfer(t *models.OwnershipTransfer) error {
	if t.VehicleID == "" || t.OwnerOldID == "" || t.OwnerNewID == "" {
		return errors.New("vehicleId, ownerOldId, ownerNewId are required")
	}
	if t.DateOfTransfer.IsZero() {
		t.DateOfTransfer = time.Now()
	}

	return s.DB.Transaction(func(tx *gorm.DB) error {
		var veh models.Vehicle
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			First(&veh, "id = ?", t.VehicleID).Error; err != nil {
			return err
		}

		// ensure owners exist
		var oldO, newO models.Owner
		if err := tx.First(&oldO, "id = ?", t.OwnerOldID).Error; err != nil {
			return err
		}
		if err := tx.First(&newO, "id = ?", t.OwnerNewID).Error; err != nil {
			return err
		}

		if err := tx.Create(t).Error; err != nil {
			return err
		}

		veh.OwnerID = t.OwnerNewID
		return tx.Save(&veh).Error
	})
}

func (s *Store) ListTransfers(out *[]models.OwnershipTransfer) error {
	return s.DB.
		Preload("Vehicle").Preload("Vehicle.Owner").
		Preload("OwnerOld").Preload("OwnerNew").
		Order("date_of_transfer desc").
		Find(out).Error
}
