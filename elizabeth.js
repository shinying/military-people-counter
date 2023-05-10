const OFFICER_BTN = "btn-outline-danger";
const SERGENT_BTN = "btn-outline-info";
const SOILDER_BTN = "btn-outline-secondary";
const BADGE_COLOR = "bg-dark";
const RANKS = ["#officer", "#sergeant", "#soilder"];
const BTN_CLASS = [OFFICER_BTN, SERGENT_BTN, SOILDER_BTN];
const backend = "https://baoge.fly.dev"


$(function() {
    let member_num = [0, 0, 0];
    let member_rank = {};
    
    let selected_reason;
    let delete_mode = false;
    
    let reasons = [];
    let members = [];

    let members_to_delete = new Set();
    let reasons_to_delete = new Set();

    let hash = function(value) { return MD5.generate(value).substr(16); };

    function activate(item, fn) {
        item.addClass("active");
        item.off("click");
        item.click(fn);
    }

    function deactivate(item, fn) {
        item.removeClass("active");
        item.off("click");
        item.click(fn);
    }
    

    function read_from_local() {
        if (localStorage.length === 0)
            return;
        if (!localStorage.hasOwnProperty("reasons") && !localStorage.hasOwnProperty("members")) {
            console.log("No reasons and members. Clear localStorage")
            localStorage.clear();
            return;
        }

        // Read reasons
        if ("reasons" in localStorage)
            reasons = JSON.parse(localStorage.getItem("reasons"));
        for (const reason of reasons) {
            add_reason(localStorage.getItem(`r-${reason}`, reason));
        }

        // Read members
        if ("members" in localStorage)
            members = JSON.parse(localStorage.getItem("members"));
        for (const member of members) {
            let item = localStorage.getItem(`m-${member}`);
            if (!item) continue;
            let detail = JSON.parse(item);

            if (!detail.hasOwnProperty("key")) {
                console.log("No key. Clear localStorage")
                localStorage.clear();
                return;
            }

            add_member(detail["name"], detail["rank"], detail["key"], detail["reason"]);
            if (detail["reason"]) {
                $(`#${detail["key"]}`).removeClass("active");
            } else {
                member_num[detail["rank"]]++;
            }
        }
        update_ui();
    }
    read_from_local();


    function add_member(name, rank, id="", reason="") {
        if (!id) {
            id = hash(name);
        }
        let box = $("<div></div>").attr({
            class: "col-auto",
            id: `div-${id}`,
        });
        let cls = `btn ${BTN_CLASS[rank]} position-relative`;
        if (!selected_reason && !reason) {
            cls += " active";
        }
        let btn = $(`<button>${name}</button>`).attr({
            type: "button",
            class: cls,
            id: id,
            // "data-bs-toggle": "button",
        });
        if (selected_reason) {
            btn.click(select_member_event);
        }
        box.append(btn);

        if (reason) {
            add_badge(btn, reason.slice(-1));
        }
        $(`${RANKS[rank]}-list`).append(box);
        member_rank[id] = rank;
        return id;
    }


    function add_badge(button, value) {
        let badge_id = `bge-${button.attr("id")}`;
        let badge = $(`#${badge_id}`);
        if (badge.length) {
            badge.html(value);
        } else {
            let badge = $(`<span>${value}</span>`).attr({
                class: `position-absolute top-0 start-100 translate-middle badge rounded-pill ${BADGE_COLOR}`,
                id: badge_id
            });
            button.append(badge);
            button.addClass("me-2");
        }
    }


    function remove_badge(button) {
        button.removeClass("me-2");
        $(`#bge-${button.attr("id")}`).remove();
    }


    function add_reason(name, id="") {
        if (!id) {
            id = hash(name);
        }
        let box = $("<div></div>").attr({
            class: "col-auto",
            id: `div-${id}`,
        });
        let btn = $(`<button>${name}</button>`).attr({
            type: "button",
            class: "btn btn-outline-primary",
            id: id,
            "data-bs-toggle": "button",
        });
        btn.click(select_reason_event);
        box.append(btn);
        $("#reason-list").append(box);
        return id;
    }

    function delete_members() {
        let remains = [];
        members.forEach(member => {
            if (!members_to_delete.has(member)) {
                remains.push(member);
            }
        });
        members = Array.from(remains);
        localStorage.setItem("members", JSON.stringify(members));

        members_to_delete.forEach(member => {
            let detail = JSON.parse(localStorage.getItem(`m-${member}`));
            if (!detail["reason"]) {
                member_num[detail["rank"]]--;
            }
            $(`#div-${member}`).remove();
            delete member_rank[member];
            localStorage.removeItem(`m-${member}`);
        });
        members_to_delete.clear();
        update_ui();
    }



    function delete_reasons() {
        let remains = [];
        reasons.forEach(reason => {
            if (!reasons_to_delete.has(reason)) {
                remains.push(reason);
            }
        });
        reasons = Array.from(remains);
        localStorage.setItem("reasons", JSON.stringify(reasons));

        members.forEach(id => {
            let detail = JSON.parse(localStorage.getItem(`m-${id}`));
            if (detail["reason"] && reasons_to_delete.has(hash(detail["reason"]))) {
                detail["reason"] = "";
                remove_badge($(`#${id}`));
                localStorage.setItem(`m-${id}`, JSON.stringify(detail));
                member_num[detail["rank"]]++;
            }
        });
        reasons_to_delete.forEach(id => {
            $(`#div-${id}`).remove();
            localStorage.removeItem(`r-${id}`);
        });
        reasons_to_delete.clear();
        update_ui();
    }


    function select_reason_event() {
        if (delete_mode) {
            reasons_to_delete.add($(this).attr("id"));
        } else {
            if (selected_reason) {
                let reason = $(`#${hash(selected_reason)}`);
                deactivate(reason, select_reason_event);
            }
            selected_reason = $(this).html();
            for (const id of members) {
                let detail = JSON.parse(localStorage.getItem(`m-${id}`));
                let member = $(`#${id}`);
                if (detail["reason"] === selected_reason) {
                    activate(member, deselect_member_event);
                } else if (detail["reason"] != selected_reason) {
                    deactivate(member, select_member_event);
                }
            }
        }
        activate($(this), deselect_reason_event);
    }


    function deselect_reason_event() {
        if (delete_mode) {
            reasons_to_delete.delete($(this).attr("id"));
        } else {
            selected_reason = "";
            show_presented_members();
        }
        deactivate($(this), select_reason_event);
    }


    function show_presented_members() {
        for (const id of members) {
            let member = $(`#${id}`);
            member.off("click");
            let detail = JSON.parse(localStorage.getItem(`m-${id}`));
            if (detail["reason"]) {
                member.removeClass("active");
            } else {
                member.addClass("active");
            }
        }
    }


    function select_member_event() {
        let member = $(this);
        activate(member, deselect_member_event)
        
        if (delete_mode) {
            members_to_delete.add(member.attr("id"));
        }
        else {
            let key = `m-${member.attr("id")}`;
            let detail = JSON.parse(localStorage.getItem(key));
            if (!detail["reason"]) {
                let rank = member_rank[member.attr("id")];
                member_num[rank]--;
                update_ui(rank);
            }
            add_badge($(this), selected_reason.slice(-1));
            detail["reason"] = selected_reason;
            localStorage.setItem(key, JSON.stringify(detail));
        }
    }
    

    function deselect_member_event() {
        let member = $(this);
        deactivate(member, select_member_event);
        
        if (delete_mode) {
            members_to_delete.delete(member.attr("id"));
        } else {
            let rank = member_rank[member.attr("id")];
            member_num[rank]++;
            update_ui(rank);

            let key = `m-${$(this).attr("id")}`;
            let detail = JSON.parse(localStorage.getItem(key));
            remove_badge($(this));
            detail["reason"] = "";
            localStorage.setItem(key, JSON.stringify(detail));
        }
    }


    function update_ui(rank=-1) {
        if (rank < 0) {
            for (let i = 0; i < member_num.length; i++) {
                $(`${RANKS[i]}-num`).text(member_num[i]);
            }
        } else {
            $(`${RANKS[rank]}-num`).text(member_num[rank]);
        }
        $("#total-num").text(member_num.reduce((a,b) => a+b));
    }


    let options_opened = false;
    function toggle_options() {
        if (options_opened) {
            // $("#add-member-div").hide();
            // $("#add-reason-div").hide();
            $("#options-btn").html("<i class=\"bi bi-plus-circle\"></i>");
            $("#deletion-btn").css("opacity", "1");
            $("#deletion-btn").click(toggle_deletion);
        } else {
            // $("#add-member-div").show();
            // $("#add-reason-div").show();
            $("#options-btn").html("<i class=\"bi bi-plus-circle-fill\"></i>");
            $("#deletion-btn").css("opacity", "0.5");
            $("#deletion-btn").off("click");
        }
        options_opened = !options_opened;
    }

    $("#options-btn").click(toggle_options);


    function toggle_deletion() {
        if (delete_mode) {
            $("#delete-div").hide();
            $("#deletion-btn").html("<i class=\"bi bi-trash3\"></i>");
            $("#options-btn").css("opacity", "1");
            $("#options-btn").click(toggle_options);
            reasons.forEach(reason => {
                deactivate($(`#${reason}`), select_reason_event);
            });
            show_presented_members();
        } else {
            $("#delete-div").show();
            $("#deletion-btn").html("<i class=\"bi bi-trash3-fill\"></i>");
            $("#options-btn").css("opacity", "0.5");
            $("#options-btn").off("click");

            reasons.forEach(reason => {
                deactivate($(`#${reason}`), select_reason_event);
            });
            members.forEach(member => {
                deactivate($(`#${member}`), select_member_event);
            });
        }
        delete_mode = !delete_mode;
    }
    $("#deletion-btn").click(toggle_deletion);

    let info_opened = false;
    $("#info-btn").click(function() {
        if (info_opened) {
            // $("#quickstart").hide();
            $("#info-btn").html("<i class=\"bi bi-info-circle\"></i>");
        } else {
            // $("#quickstart").show();
            $("#info-btn").html("<i class=\"bi bi-info-circle-fill\"></i>");
        }
        info_opened = !info_opened;
    });


    $("#add-member-btn").click(function() {
        let name = $("#input-member").val();
        if (!name) {
            alert("請輸入人員");
            return;
        }
        let id = hash(name);
        if (id in member_rank) {
            alert("人員重複了");
            return;
        }
        let rank = parseInt($("#input-class option:selected").val());
        if (rank < 0) {
            alert("請選擇階級");
            return;
        }
        add_member(name, rank, id);        
        localStorage.setItem(`m-${id}`, JSON.stringify({
            "name": name,
            "rank": rank,
            "selected": false,
            "key": id,
        }));
        $("#input-member").val('');

        member_num[rank]++;
        update_ui();
        members.push(id);
        localStorage.setItem("members", JSON.stringify(members));
    });


    $("#add-reason-btn").click(function() {
        let reason = $("#input-reason").val();
        $("#input-reason").val('');
        if (!reason) {
            alert("請輸入事故");
            return;
        }
        let id = hash(reason);
        if (`r-${id}` in localStorage) {
            alert("事故重複了");
            return;
        }
        add_reason(reason, id);
        reasons.push(id);
        localStorage.setItem(`r-${id}`, reason);
        localStorage.setItem("reasons", JSON.stringify(reasons));
    });


    $("#delete-selection-btn").click(function() {
        delete_members();
        delete_reasons();
        reasons.forEach(reason => {
            deactivate($(`#${reason}`), select_reason_event);
        });
        members.forEach(member => {
            deactivate($(`#${member}`), select_member_event);
        });
    });


    function delete_everything() {
        for (const member of members) {
            $(`#div-${member}`).remove();
        }
        members = [];
        members_to_delete.clear();

        for (const reason of reasons) {
            $(`#div-${reason}`).remove();
        }
        reasons = [];
        reasons_to_delete.clear();

        member_num.fill(0);
        update_ui();
        localStorage.clear();
    }
    
    $("#delete-all-btn").click(delete_everything)


    $("#share-btn").click(function() {
        $("#share-result").html("<div class=\"spinner-border\" role=\"status\"></div>")
    })    

    $("#gen-share-code-btn").click(function() {
        if (localStorage.length === 0 ||
            (!localStorage.hasOwnProperty("reasons") && !localStorage.hasOwnProperty("members"))) {
            $("#share-result").html(
                `<h1 class=\"text-danger\">資料不足</h1>`);
            return;
        }
        $.ajax({
            url: `${backend}/share`,
            method: "POST",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(localStorage),
            timeout: 10000,

            success: function(res) {
                $("#share-result").html(
                    `<h1 class=\"text-success\" style=\"font-size:3rem\">${res["code"]}</h1>`);
            },
            error:function(err){
                $("#share-result").html(
                    `<h3 class=\"text-danger\">分享失敗QQ</h3>`);
                console.log(err)
            },
          });
    });


    $("#retrieve-btn").click(function() {
        let code = parseInt($("#input-share-code").val());
        $("#input-share-code").val('');

        $.ajax({
            url: `${backend}/retrieve`,
            method: "POST",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify({"code": code}),
            timeout: 10000,

            success: function(res) {
                delete_everything();
                for (let key in res) {
                    localStorage.setItem(key, res[key]);
                }
                read_from_local();
                $("#share-result").html(
                    `<h1 class=\"text-success\">擷取成功</h1>`);
                $('#share-dialogue-2').modal('hide');
            },
            error:function(err){
                $("#share-result").html(
                    `<h1 class=\"text-danger\">代碼無效</h1>`);
                console.log(err)
            },
          });
    })


});